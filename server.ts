import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

server.on('error', (err) => {
  console.error('HTTP Server Error:', err);
});

wss.on('error', (err) => {
  console.error('WebSocket Server Error:', err);
});

const PORT = 3000;
const ai = new GoogleGenAI({ apiKey: "dummy_key" }); // Backend doesn't need API key anymore

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Debug logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- Helper Functions ---
const formatHistoryForGemini = (history: { role: string; text: string }[], newMessage: string) => {
  const raw = [...history, { role: 'user', text: newMessage }];
  const formatted: { role: string; parts: { text: string }[] }[] = [];
  
  for (const msg of raw) {
      const role = msg.role === 'model' ? 'model' : 'user';
      if (formatted.length > 0 && formatted[formatted.length - 1].role === role) {
          formatted[formatted.length - 1].parts[0].text += `\n\n${msg.text}`;
      } else {
          formatted.push({ role, parts: [{ text: msg.text }] });
      }
  }
  return formatted;
};

// --- API Routes ---
app.get("/api/get-gemini-key", (req, res) => {
    res.status(500).json({ error: "API key not available on server" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { history, message, systemInstruction, file, image } = req.body;
    const attachment = file || image;

    if (!message && !attachment) {
      return res.status(400).json({ error: "Message or file is required" });
    }

    const contents = formatHistoryForGemini(history || [], message || "");

    // Add file if present
    if (attachment && attachment.data && attachment.mimeType) {
      const lastTurn = contents[contents.length - 1];
      if (lastTurn.role === 'user') {
        lastTurn.parts.push({
          inlineData: {
            data: attachment.data,
            mimeType: attachment.mimeType
          }
        } as any);
      }
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: contents,
            config: { systemInstruction: systemInstruction || "You are a helpful assistant." }
        });
        return res.json({ text: response.text });
    } catch (error: any) {
        console.error("Model generation failed with primary model:", error);
        try {
            console.log("Attempting fallback to gemini-2.5-flash...");
            const fallbackResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents,
                config: { systemInstruction: systemInstruction || "You are a helpful assistant." }
            });
            return res.json({ text: fallbackResponse.text });
        } catch (fallbackError: any) {
            console.error("Model generation failed with fallback model:", fallbackError);
            throw fallbackError;
        }
    }

  } catch (error: any) {
    console.error("Chat API Error:", error);
    let errorMessage = error.message || "Internal Server Error";
    try {
        // If the error message is a JSON string, try to parse it to extract the actual message
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error && parsedError.error.message) {
            errorMessage = parsedError.error.message;
        }
    } catch (e) {
        // Not a JSON string, ignore
    }
    res.status(500).json({ error: errorMessage });
  }
});

// --- WebSocket Handling (Live API) ---
wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected to WebSocket");

  let session: any = null;

  ws.on("message", async (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log("Received WebSocket message type:", msg.type);

      if (msg.type === "config") {
        // Initialize Gemini Live Session
        const connectToGemini = async (model: string) => {
            console.log(`Attempting to connect to Gemini Live with model: ${model}`);
            return ai.live.connect({
                model,
                callbacks: {
                  onopen: () => {
                    console.log(`Gemini Live Session Opened (${model})`);
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: "connected" }));
                    }
                  },
                  onmessage: (message: LiveServerMessage) => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify(message));
                    }
                  },
                  onclose: () => {
                    console.log("Gemini Live Session Closed");
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.close();
                    }
                  },
                  onerror: (err: any) => {
                    console.error("Gemini Live Session Error:", err);
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ error: err.message }));
                    }
                  }
                },
                config: {
                  responseModalities: [Modality.AUDIO],
                  outputAudioTranscription: {},
                  inputAudioTranscription: {},
                  systemInstruction: msg.systemInstruction || "You are a helpful assistant.",
                  speechConfig: { 
                    voiceConfig: { 
                      prebuiltVoiceConfig: { 
                        voiceName: msg.voiceName || 'Kore' 
                      } 
                    } 
                  }
                }
            });
        };

        try {
            try {
                session = await connectToGemini('gemini-2.5-flash-native-audio-preview-12-2025');
            } catch (err) {
                console.warn("Failed with primary model, trying fallback: gemini-2.5-flash-native-audio-preview-09-2025");
                session = await connectToGemini('gemini-2.5-flash-native-audio-preview-09-2025');
            }
        } catch (err: any) {
            console.error("Failed to connect to Gemini Live (All models):", err);
            ws.send(JSON.stringify({ error: "Failed to connect to Gemini Live. Please check API Key or Model availability." }));
        }
      } else if (msg.realtimeInput) {
          // Forward audio/input to Gemini
          if (session) {
              const input = Array.isArray(msg.realtimeInput) ? msg.realtimeInput[0] : msg.realtimeInput;
              // session is now the object, not a promise
              session.sendRealtimeInput(input);
          }
      } else if (msg.toolResponse) {
          if (session) {
              session.sendToolResponse(msg.toolResponse);
          }
      }
    } catch (err) {
      console.error("WebSocket Message Error:", err);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    if (session) {
        session.close();
    }
  });
});

// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files (if built)
    app.use(express.static("dist"));
    
    // SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  const serverInstance = server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const shutdown = () => {
    console.log('Shutting down server...');
    serverInstance.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
