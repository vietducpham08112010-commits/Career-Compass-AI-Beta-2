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
const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  console.error("WARNING: GEMINI_API_KEY/API_KEY is missing in environment variables. Chat features will fail.");
  // Do not exit, allow server to start so UI can load
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "dummy_key" }); // Prevent crash on init, but calls will fail

app.use(express.json());

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
  if (API_KEY) {
    res.json({ key: API_KEY });
  } else {
    res.status(500).json({ error: "API key not configured on server" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { history, message, systemInstruction, image } = req.body;

    if (!message && !image) {
      return res.status(400).json({ error: "Message or image is required" });
    }

    const contents = formatHistoryForGemini(history || [], message || "");

    // Add image if present
    if (image && image.data && image.mimeType) {
      const lastTurn = contents[contents.length - 1];
      if (lastTurn.role === 'user') {
        lastTurn.parts.push({
          inlineData: {
            data: image.data,
            mimeType: image.mimeType
          }
        } as any);
      }
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: contents,
            config: { systemInstruction: systemInstruction || "You are a helpful assistant." }
        });
        return res.json({ text: response.text });
    } catch (error: any) {
        console.error("Model generation failed:", error);
        throw error;
    }

  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
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
        if (!API_KEY) {
            console.error("API_KEY is missing. Cannot connect to Gemini Live.");
            ws.send(JSON.stringify({ error: "Server Configuration Error: API Key is missing." }));
            return;
        }

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
