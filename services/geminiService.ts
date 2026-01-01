import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { TRANSLATIONS } from "../constants";
import { Language } from "../types";

// Ideally, this should be initialized inside functions or a class to handle key changes,
// but for this scope we assume env key is static.
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const sendChatMessage = async (
  history: { role: 'user' | 'model', text: string }[],
  newMessage: string,
  language: Language
) => {
  const ai = getAIClient();
  const t = TRANSLATIONS[language];
  
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            ...history.map(h => ({
                role: h.role,
                parts: [{ text: h.text }]
            })),
            { role: 'user', parts: [{ text: newMessage }] }
        ],
        config: {
            systemInstruction: t.systemInstruction
        }
    });
    return response.text;
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
};

export class LiveSessionManager {
  private sessionPromise: Promise<any> | null = null;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private language: Language;
  
  // Callbacks for UI updates
  public onConnect?: () => void;
  public onDisconnect?: () => void;
  public onError?: (err: any) => void;
  public onAudioLevel?: (level: number) => void; // Visualizer
  public onTranscript?: (text: string, isUser: boolean) => void;

  constructor(language: Language) {
    this.language = language;
  }

  async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true }); // Request permission first
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(d => d.kind === 'audioinput');
    } catch (e) {
        console.error("Error enumerating devices", e);
        return [];
    }
  }

  async connect(
      deviceId: string | undefined,
      decodeAudioData: (data: Uint8Array, ctx: AudioContext, rate: number, ch: number) => Promise<AudioBuffer>,
      createBlob: (data: Float32Array) => any,
      decode: (base64: string) => Uint8Array
  ) {
    const ai = getAIClient();
    const t = TRANSLATIONS[this.language];

    try {
      this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const constraints = {
          audio: deviceId ? { deviceId: { exact: deviceId } } : true
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      this.sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Live Session Opened');
            this.startAudioStreaming(createBlob);
            if (this.onConnect) this.onConnect();
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle Transcriptions
            if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                if (text && this.onTranscript) this.onTranscript(text, false);
            } else if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                if (text && this.onTranscript) this.onTranscript(text, true);
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && this.outputContext) {
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                this.outputContext,
                24000,
                1
              );
              this.playAudio(audioBuffer);
            }

            if (message.serverContent?.interrupted) {
                this.stopCurrentAudio();
            }
          },
          onclose: () => {
            console.log('Live Session Closed');
            this.cleanup();
            if (this.onDisconnect) this.onDisconnect();
          },
          onerror: (err) => {
            console.error('Live Session Error', err);
            if (this.onError) this.onError(err);
            this.cleanup();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {}, // Enable transcription
          inputAudioTranscription: {},  // Enable transcription
          systemInstruction: t.voiceSystemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        }
      });
    } catch (e) {
      console.error("Connection failed", e);
      if (this.onError) this.onError(e);
    }
  }

  private startAudioStreaming(createBlob: (data: Float32Array) => any) {
    if (!this.inputContext || !this.stream) return;

    this.inputSource = this.inputContext.createMediaStreamSource(this.stream);
    this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate volume for visualizer
      let sum = 0;
      for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
      if (this.onAudioLevel) this.onAudioLevel(Math.sqrt(sum / inputData.length));

      const pcmBlob = createBlob(inputData);
      
      this.sessionPromise?.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputContext.destination);
  }

  private playAudio(buffer: AudioBuffer) {
    if (!this.outputContext) return;

    this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
    const source = this.outputContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputContext.destination);
    
    source.addEventListener('ended', () => {
        this.sources.delete(source);
    });

    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    this.sources.add(source);
  }

  private stopCurrentAudio() {
      this.sources.forEach(s => s.stop());
      this.sources.clear();
      this.nextStartTime = 0;
      if (this.outputContext) this.nextStartTime = this.outputContext.currentTime;
  }

  disconnect() {
      this.sessionPromise?.then(session => session.close());
      this.cleanup();
  }

  private cleanup() {
      this.processor?.disconnect();
      this.inputSource?.disconnect();
      this.stream?.getTracks().forEach(t => t.stop());
      this.inputContext?.close();
      this.outputContext?.close();
      
      this.inputContext = null;
      this.outputContext = null;
      this.stream = null;
      this.processor = null;
      this.sources.clear();
      this.nextStartTime = 0;
  }
}