import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { TRANSLATIONS } from "../constants";
import { Language, AIProvider, UserProfile } from "../types";

// Explicitly configured API Key
const API_KEY = 'AIzaSyAyNncB2gnBDdPYeffrsFkM1V3toYvdU3U';

export const getAIClient = () => new GoogleGenAI({ apiKey: API_KEY });

// Function to call a generic OpenAI-compatible API (Works with Ollama, vLLM, LocalAI)
const sendCustomModelMessage = async (
  endpoint: string,
  modelName: string,
  history: { role: string; text: string }[],
  newMessage: string,
  systemInstruction: string
) => {
  try {
    // Map 'model' role to 'assistant' for standard OpenAI format
    const messages = [
      { role: "system", content: systemInstruction },
      ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text })),
      { role: "user", content: newMessage }
    ];

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add "Authorization": "Bearer YOUR_KEY" here if using a secured custom server
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        stream: false,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Custom API Error: ${response.statusText}`);
    }

    const data = await response.json();
    // Support standard OpenAI response format or Ollama format
    return data.choices?.[0]?.message?.content || data.message?.content || "No response from model.";
  } catch (error) {
    console.error("Custom Model Error:", error);
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
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`n8n Webhook Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check for common output fields n8n users typically map to
    if (data.output && typeof data.output === 'string') return data.output;
    if (data.text && typeof data.text === 'string') return data.text;
    if (data.response && typeof data.response === 'string') return data.response;
    if (data.message && typeof data.message === 'string') return data.message;
    
    // If n8n returns a generic object that looks like OpenAI format
    if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;

    return JSON.stringify(data); // Fallback to raw JSON if no text field found
  } catch (error) {
    console.error("n8n Error:", error);
    throw error;
  }
};

// Helper: Ensure strict User -> Model -> User alternation for Gemini
const formatHistoryForGemini = (history: { role: string; text: string }[], newMessage: string) => {
  const raw = [...history, { role: 'user', text: newMessage }];
  const formatted: { role: string; parts: { text: string }[] }[] = [];
  
  for (const msg of raw) {
      // Normalize role: Gemini uses 'user' and 'model'
      const role = msg.role === 'model' ? 'model' : 'user';
      
      if (formatted.length > 0 && formatted[formatted.length - 1].role === role) {
          // Merge consecutive messages of the same role
          formatted[formatted.length - 1].parts[0].text += `\n\n${msg.text}`;
      } else {
          formatted.push({ role, parts: [{ text: msg.text }] });
      }
  }
  return formatted;
};

export const sendChatMessage = async (
  history: { role: string; text: string }[], 
  newMessage: string, 
  language: Language,
  userProfile?: UserProfile | null
) => {
  const t = TRANSLATIONS[language];
  const systemInstruction = t.systemInstruction;

  // Check Provider
  if (userProfile?.aiProvider === AIProvider.N8N && userProfile.customEndpoint) {
      return await sendN8NMessage(userProfile.customEndpoint, history, newMessage, systemInstruction, userProfile);
  }

  if (userProfile?.aiProvider === AIProvider.CUSTOM && userProfile.customEndpoint) {
    const endpoint = userProfile.customEndpoint;
    const modelName = userProfile.customModelName || "llama3";
    return await sendCustomModelMessage(endpoint, modelName, history, newMessage, systemInstruction);
  }

  // Default: Use Google Gemini
  const ai = getAIClient();
  const contents = formatHistoryForGemini(history, newMessage);

  try {
    // Attempt 1: Try the latest preview model (Gemini 3 Flash)
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: { systemInstruction: systemInstruction }
    });
    return response.text;
  } catch (error: any) {
    console.warn("Primary model (gemini-3-flash-preview) failed. Attempting fallback...", error);
    
    try {
        // Attempt 2: Fallback to Gemini 2.5 Flash (Stable)
        // 'gemini-flash-latest' maps to the latest stable flash model
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: contents,
            config: { systemInstruction: systemInstruction }
        });
        return response.text;
    } catch (fallbackError: any) {
        console.error("Fallback model also failed:", fallbackError);
        // Re-throw the original error to show to user, or a combined message
        throw new Error(`Gemini API Error: ${error.message || "Network Error"}`);
    }
  }
};

export class LiveSessionManager {
  language: Language;
  sessionPromise: any;
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

  constructor(language: Language) { 
    this.language = language;
    this.sessionPromise = null;
    this.inputContext = null;
    this.outputContext = null;
    this.inputSource = null;
    this.processor = null;
    this.stream = null;
    this.nextStartTime = 0;
    this.sources = new Set();
  }

  async getAudioInputDevices() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(d => d.kind === 'audioinput');
    } catch (e) { return []; }
  }

  async connect(deviceId: string, decodeAudioDataFn: any, createBlobFn: any, decodeFn: any) {
    const ai = getAIClient();
    const t = TRANSLATIONS[this.language];

    try {
      this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const constraints = { audio: deviceId ? { deviceId: { exact: deviceId } } : true };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Using the latest model as per request
      this.sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => { this.startAudioStreaming(createBlobFn); if (this.onConnect) this.onConnect(); },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                if (text && this.onTranscript) this.onTranscript(text, false);
            } else if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                if (text && this.onTranscript) this.onTranscript(text, true);
            }
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && this.outputContext) {
              const audioBuffer = await decodeAudioDataFn(decodeFn(base64Audio), this.outputContext, 24000, 1);
              this.playAudio(audioBuffer);
            }
            if (message.serverContent?.interrupted) this.stopCurrentAudio();
          },
          onclose: () => { this.cleanup(); if (this.onDisconnect) this.onDisconnect(); },
          onerror: (err: any) => { if (this.onError) this.onError(err); this.cleanup(); }
        },
        config: {
          responseModalities: [Modality.AUDIO], outputAudioTranscription: {}, inputAudioTranscription: {},
          systemInstruction: t.voiceSystemInstruction, speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      });
    } catch (e) { if (this.onError) this.onError(e); }
  }

  startAudioStreaming(createBlobFn: any) {
    if (!this.inputContext || !this.stream) return;
    this.inputSource = this.inputContext.createMediaStreamSource(this.stream);
    this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      let sum = 0; for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
      if (this.onAudioLevel) this.onAudioLevel(Math.sqrt(sum / inputData.length));
      const pcmBlob = createBlobFn(inputData);
      this.sessionPromise?.then((session: any) => { session.sendRealtimeInput({ media: pcmBlob }); });
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

  disconnect() { this.sessionPromise?.then((session: any) => session.close()); this.cleanup(); }

  cleanup() {
      this.processor?.disconnect(); this.inputSource?.disconnect();
      this.stream?.getTracks().forEach(t => t.stop());
      this.inputContext?.close(); this.outputContext?.close();
      this.inputContext = null; this.outputContext = null; this.stream = null; this.processor = null;
      this.sources.clear(); this.nextStartTime = 0;
  }
}