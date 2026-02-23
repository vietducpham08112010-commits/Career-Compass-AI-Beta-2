import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

const PORT = 3000;
const API_KEY = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

if (!API_KEY) {
  console.error("WARNING: GEMINI_API_KEY (or AI_API_KEY) is missing in environment variables. Chat features will fail.");
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
app.post("/api/chat", async (req, res) => {
  try {
    const { history, message, systemInstruction } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const contents = formatHistoryForGemini(history || [], message);

    try {
        // Attempt 1: Gemini 2.0 Flash
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: contents,
            config: { systemInstruction: systemInstruction || "You are a helpful assistant." }
        });
        return res.json({ text: response.text });
    } catch (error: any) {
        console.warn("Primary model failed, trying fallback...", error.message);
        // Attempt 2: Fallback
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: contents,
            config: { systemInstruction: systemInstruction || "You are a helpful assistant." }
        });
        return res.json({ text: response.text });
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

      if (msg.type === "config") {
        // Initialize Gemini Live Session
        try {
          session = await ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            callbacks: {
              onopen: () => {
                console.log("Gemini Live Session Opened");
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "connected" }));
                }
              },
              onmessage: (message: LiveServerMessage) => {
                if (ws.readyState === WebSocket.OPEN) {
                    // Forward the raw message object to the client
                    // The client expects the structure of LiveServerMessage
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
        } catch (err: any) {
            console.error("Failed to connect to Gemini Live:", err);
            ws.send(JSON.stringify({ error: "Failed to connect to Gemini Live" }));
        }
      } else if (msg.realtimeInput) {
          // Forward audio/input to Gemini
          if (session) {
              session.sendRealtimeInput(msg.realtimeInput);
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
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files (if built)
    // For this environment, we mostly rely on Vite dev server
    app.use(express.static("dist"));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
