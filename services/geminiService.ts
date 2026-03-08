
import { GoogleGenAI, Modality } from "@google/genai";
import type { LiveServerMessage } from "@google/genai";
import { TRANSLATIONS } from "../constants";
import { Language, AIProvider, UserProfile } from "../types";
import { downsampleBuffer } from "../utils/audio";

// --- API CLIENT (Backend Proxy) ---

export const sendChatMessage = async (
  history: { role: string; text: string }[], 
  newMessage: string, 
  language: Language,
  userProfile?: UserProfile | null
) => {
  const t = TRANSLATIONS[language];
  let systemInstruction = t.systemInstruction;
  
  if (userProfile?.careerProfile) {
      systemInstruction += `\n\nUser's Career Profile (RIASEC): ${userProfile.careerProfile}`;
  }

  // Check Provider - ONLY use external APIs if user explicitly configured them
  if (userProfile?.aiProvider === AIProvider.N8N && userProfile.customEndpoint) {
      return await sendN8NMessage(userProfile.customEndpoint, history, newMessage, systemInstruction, userProfile);
  }

  if (userProfile?.aiProvider === AIProvider.CUSTOM && userProfile.customEndpoint) {
    const endpoint = userProfile.customEndpoint;
    const modelName = userProfile.customModelName || "llama3";
    return await sendExternalApiMessage(endpoint, modelName, history, newMessage, systemInstruction);
  }

  // --- DEFAULT: GOOGLE GEMINI (VIA BACKEND) ---
  try {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            history,
            message: newMessage,
            systemInstruction
        })
    });

    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.error("Invalid JSON response:", text);
        throw new Error(`Server returned invalid response (Status: ${response.status}). It might be restarting.`);
    }

    if (!response.ok) {
        throw new Error(data.error || `Server Error: ${response.status}`);
    }

    return data.text;
  } catch (error: any) {
    console.error("Chat API Error:", error);
    throw new Error(error.message || "Failed to communicate with the server.");
  }
};

// Function to call a Generic External API (For Custom/Self-Hosted providers only)
const sendExternalApiMessage = async (
  endpoint: string,
  modelName: string,
  history: { role: string; text: string }[],
  newMessage: string,
  systemInstruction: string
) => {
  try {
    const messages = [
      { role: "system", content: systemInstruction },
      ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text })),
      { role: "user", content: newMessage }
    ];

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        stream: false,
        temperature: 0.7
      })
    });

    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error(`External API returned invalid JSON (Status: ${response.status})`);
    }

    if (!response.ok) {
        throw new Error(data.error?.message || data.error || `External API Error: ${response.statusText}`);
    }
    
    return data.choices?.[0]?.message?.content || data.message?.content || "No response from external model.";
  } catch (error) {
    console.error("External Model Error:", error);
    throw error;
  }
};

// Function to call n8n Webhook
const sendN8NMessage = async (
  webhookUrl: string,
  history: { role: string; text: string }[],
  newMessage: string,
  systemInstruction: string,
  userProfile?: UserProfile | null
) => {
  try {
    const payload = {
        message: newMessage,
        history: history,
        systemInstruction: systemInstruction,
        userEmail: userProfile?.email || 'guest',
        timestamp: new Date().toISOString()
    };

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error(`n8n Webhook returned invalid JSON (Status: ${response.status})`);
    }

    if (!response.ok) {
        throw new Error(data.error || `n8n Webhook Error: ${response.statusText}`);
    }
    
    if (data.output && typeof data.output === 'string') return data.output;
    if (data.text && typeof data.text === 'string') return data.text;
    if (data.response && typeof data.response === 'string') return data.response;
    if (data.message && typeof data.message === 'string') return data.message;
    if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;

    return JSON.stringify(data);
  } catch (error) {
    console.error("n8n Error:", error);
    throw error;
  }
};

export class LiveSessionManager {
  language: Language;
  userProfile?: UserProfile | null;
  session: any | null;
  inputContext: AudioContext | null;
  outputContext: AudioContext | null;
  inputSource: MediaStreamAudioSourceNode | null;
  processor: ScriptProcessorNode | null;
  stream: MediaStream | null;
  nextStartTime: number;
  sources: Set<AudioBufferSourceNode>;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (err: any) => void;
  onAudioLevel?: (level: number) => void;
  onTranscript?: (text: string, isUser: boolean) => void;

  isConnected: boolean;

  constructor(language: Language, userProfile?: UserProfile | null) { 
    this.language = language;
    this.userProfile = userProfile;
    this.session = null;
    this.inputContext = null;
    this.outputContext = null;
    this.inputSource = null;
    this.processor = null;
    this.stream = null;
    this.nextStartTime = 0;
    this.sources = new Set();
    this.isConnected = false;
  }

  async getAudioInputDevices() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn("MediaDevices API not supported or not in a secure context.");
            return [];
        }
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(d => d.kind === 'audioinput');
    } catch (e) { return []; }
  }

  async connect(deviceId: string, decodeAudioDataFn: any, createBlobFn: any, decodeFn: any) {
    const t = TRANSLATIONS[this.language];
    let systemInstruction = t.voiceSystemInstruction;
    
    if (this.userProfile?.careerProfile) {
        systemInstruction += `\n\nUser's Career Profile (RIASEC): ${this.userProfile.careerProfile}`;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("MediaDevices API not supported. Please use HTTPS.");
      }
      this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      if (this.inputContext.state === 'suspended') { await this.inputContext.resume(); }
      if (this.outputContext.state === 'suspended') { await this.outputContext.resume(); }

      const constraints = { audio: deviceId ? { deviceId: { exact: deviceId } } : true };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.inputContext.sampleRate !== 16000) {
          console.warn(`AudioContext sample rate is ${this.inputContext.sampleRate}, expected 16000. Audio might be distorted.`);
      }

      // Fetch API Key
      const keyResponse = await fetch('/api/get-gemini-key');
      if (!keyResponse.ok) throw new Error("Failed to fetch API key");
      const { key } = await keyResponse.json();
      
      const ai = new GoogleGenAI({ apiKey: key });

      const connectToGemini = async (model: string) => {
          console.log(`Attempting to connect to Gemini Live with model: ${model}`);
          const sessionPromise = ai.live.connect({
              model,
              callbacks: {
                onopen: () => {
                  console.log(`Gemini Live Session Opened (${model})`);
                  this.isConnected = true;
                  this.startAudioStreaming(createBlobFn, sessionPromise);
                  if (this.onConnect) this.onConnect();
                  
                  // Prompt AI to start the conversation
                  sessionPromise.then(session => {
                      const prompt = this.language === 'vi' 
                          ? "Xin chào, hãy chủ động chào hỏi và bắt đầu cuộc trò chuyện với tôi."
                          : "Hello, please greet me and start the conversation.";
                      session.sendRealtimeInput([{ text: prompt }]);
                  });
                },
                onmessage: async (message: LiveServerMessage) => {
                  const serverContent = message.serverContent;
                  if (serverContent) {
                      if (serverContent.outputTranscription) {
                          const text = serverContent.outputTranscription.text;
                          if (text && this.onTranscript) this.onTranscript(text, false);
                      } else if (serverContent.inputTranscription) {
                          const text = serverContent.inputTranscription.text;
                          if (text && this.onTranscript) this.onTranscript(text, true);
                      }
                      
                      const base64Audio = serverContent.modelTurn?.parts?.[0]?.inlineData?.data;
                      if (base64Audio && this.outputContext) {
                        const audioBuffer = await decodeAudioDataFn(decodeFn(base64Audio), this.outputContext, 24000, 1);
                        this.playAudio(audioBuffer);
                      }
                      
                      if (serverContent.interrupted) this.stopCurrentAudio();
                  }
                },
                onclose: () => {
                  console.log("Gemini Live Session Closed");
                  if (!this.isConnected && this.onError) {
                      this.onError("Connection failed. Please check your network or try again.");
                  }
                  this.cleanup(); 
                  if (this.onDisconnect) this.onDisconnect(); 
                },
                onerror: (err: any) => {
                  console.error("Gemini Live Session Error:", err);
                  if (this.onError) this.onError(err.message || err);
                  this.cleanup();
                }
              },
              config: {
                responseModalities: [Modality.AUDIO],
                outputAudioTranscription: {},
                inputAudioTranscription: {},
                systemInstruction: systemInstruction,
                speechConfig: { 
                  voiceConfig: { 
                    prebuiltVoiceConfig: { 
                      voiceName: 'Kore' 
                    } 
                  } 
                }
              }
          });
          return sessionPromise;
      };

      try {
          this.session = await connectToGemini('gemini-2.5-flash-native-audio-preview-09-2025');
      } catch (err) {
          console.warn("Failed with primary model, trying fallback: gemini-2.0-flash-exp");
          this.session = await connectToGemini('gemini-2.0-flash-exp');
      }

    } catch (e) { 
        if (this.onError) this.onError(e); 
        throw e;
    }
  }

  startAudioStreaming(createBlobFn: any, sessionPromise?: Promise<any>) {
    if (!this.inputContext || !this.stream) return;
    this.inputSource = this.inputContext.createMediaStreamSource(this.stream);
    
    // Using ScriptProcessorNode for now as AudioWorklet requires a separate file
    this.processor = this.inputContext.createScriptProcessor(2048, 1, 1);
    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      let sum = 0; for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
      if (this.onAudioLevel) this.onAudioLevel(Math.sqrt(sum / inputData.length));
      
      const downsampled = downsampleBuffer(inputData, this.inputContext?.sampleRate || 16000, 16000);
      const pcmBlob = createBlobFn(downsampled, 16000);
      
      if (sessionPromise) {
          sessionPromise.then(session => {
              if (this.isConnected) {
                  session.sendRealtimeInput({ media: { data: pcmBlob.data, mimeType: pcmBlob.mimeType } });
              }
          });
      } else if (this.session && this.isConnected) {
          this.session.sendRealtimeInput({ media: { data: pcmBlob.data, mimeType: pcmBlob.mimeType } });
      }
    };
    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputContext.destination);
  }

  playAudio(buffer: AudioBuffer) {
    if (!this.outputContext) return;
    this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
    const source = this.outputContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputContext.destination);
    source.addEventListener('ended', () => { this.sources.delete(source); });
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    this.sources.add(source);
  }

  stopCurrentAudio() {
      this.sources.forEach(s => s.stop()); this.sources.clear();
      this.nextStartTime = 0;
      if (this.outputContext) this.nextStartTime = this.outputContext.currentTime;
  }

  disconnect() { 
      if (this.session) {
          this.session.close();
      }
      this.cleanup(); 
  }

  cleanup() {
      this.processor?.disconnect(); this.inputSource?.disconnect();
      this.stream?.getTracks().forEach(t => t.stop());
      this.inputContext?.close(); this.outputContext?.close();
      this.inputContext = null; this.outputContext = null; this.stream = null; this.processor = null;
      this.sources.clear(); this.nextStartTime = 0;
      this.session = null;
      this.isConnected = false;
  }
}
