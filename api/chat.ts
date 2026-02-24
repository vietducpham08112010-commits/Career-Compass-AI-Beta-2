import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCA0oLUU2bYKs4_MylRJ1ng_XUpmTOqoKU";
const ai = new GoogleGenAI({ apiKey: API_KEY });

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { history, message, systemInstruction } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const contents = formatHistoryForGemini(history || [], message);

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: { systemInstruction: systemInstruction || "You are a helpful assistant." }
    });
    
    return res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
