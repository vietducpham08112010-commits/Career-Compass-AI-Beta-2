import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { TRANSLATIONS } from "../constants";
import { Language } from "../types";

export const getAIClient = () => new GoogleGenAI({ apiKey: "AIzaSyAyNncB2gnBDdPYeffrsFkM1V3toYvdU3U" });

export const sendChatMessage = async (history: { role: string; text: string }[], newMessage: string, language: Language) => {
  const ai = getAIClient();
  const t = TRANSLATIONS[language];
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: newMessage }] }],
        config: { systemInstruction: t.systemInstruction }
    });
    return response.text;
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
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

      this.sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
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