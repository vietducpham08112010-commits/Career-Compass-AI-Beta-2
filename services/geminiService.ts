
import type { LiveServerMessage } from "@google/genai";
import { TRANSLATIONS } from "../constants";
import { Language, AIProvider, UserProfile } from "../types";

// --- API CLIENT (Backend Proxy) ---

export const sendChatMessage = async (
  history: { role: string; text: string }[], 
  newMessage: string, 
  language: Language,
  userProfile?: UserProfile | null
) => {
  const t = TRANSLATIONS[language];
  const systemInstruction = t.systemInstruction;

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
  ws: WebSocket | null;
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
    this.ws = null;
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
    const t = TRANSLATIONS[this.language];

    try {
      this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      if (this.inputContext.state === 'suspended') { await this.inputContext.resume(); }
      if (this.outputContext.state === 'suspended') { await this.outputContext.resume(); }

      const constraints = { audio: deviceId ? { deviceId: { exact: deviceId } } : true };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Connect to Backend WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Send Config
        this.ws?.send(JSON.stringify({
            type: 'config',
            systemInstruction: t.voiceSystemInstruction,
            voiceName: 'Kore'
        }));
      };

      this.ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'connected') {
            this.startAudioStreaming(createBlobFn);
            if (this.onConnect) this.onConnect();
            return;
        }

        if (message.error) {
            if (this.onError) this.onError(message.error);
            return;
        }

        // Handle LiveServerMessage structure
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
      };

      this.ws.onclose = () => { this.cleanup(); if (this.onDisconnect) this.onDisconnect(); };
      this.ws.onerror = (err) => { if (this.onError) this.onError(err); this.cleanup(); };

    } catch (e) { if (this.onError) this.onError(e); }
  }

  startAudioStreaming(createBlobFn: any) {
    if (!this.inputContext || !this.stream) return;
    this.inputSource = this.inputContext.createMediaStreamSource(this.stream);
    this.processor = this.inputContext.createScriptProcessor(2048, 1, 1);
    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      let sum = 0; for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
      if (this.onAudioLevel) this.onAudioLevel(Math.sqrt(sum / inputData.length));
      
      const pcmBlob = createBlobFn(inputData);
      // Send to WebSocket
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ realtimeInput: { media: pcmBlob } }));
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
      if (this.ws) {
          this.ws.close();
      }
      this.cleanup(); 
  }

  cleanup() {
      this.processor?.disconnect(); this.inputSource?.disconnect();
      this.stream?.getTracks().forEach(t => t.stop());
      this.inputContext?.close(); this.outputContext?.close();
      this.inputContext = null; this.outputContext = null; this.stream = null; this.processor = null;
      this.sources.clear(); this.nextStartTime = 0;
      this.ws = null;
  }
}
