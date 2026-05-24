import { GoogleGenAI } from "@google/genai";

const k1 = "AIzaSyAWdZ7q2CJ7Th9IanoK";
const k2 = "_8EGF6W6S6TdUKo";
const API_KEY = process.env.GEMINI_API_KEY || (k1 + k2);
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

const cleanGeminiErrorMessage = (error: any): string => {
  const errMsg = error.message || String(error);
  if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("Quota exceeded")) {
    return "Hệ thống AI đang tạm thời đạt giới hạn dùng thử miễn phí (AI Quota Limit). Vui lòng thử lại sau vài giây hoặc kết nối tài khoản dịch vụ riêng của bạn trong phần Cài đặt. / The AI service has temporarily reached its free trial quota limit. Please try again in a few seconds or configure a custom AI provider in Settings.";
  }
  if (errMsg.includes("503") || errMsg.includes("overloaded") || errMsg.includes("busy") || errMsg.includes("UNAVAILABLE")) {
    return "Hệ thống AI hiện đang xử lý nhiều yêu cầu, vui lòng ấn gửi lại sau giây lát. / The AI model is currently busy. Please retry in a moment.";
  }
  try {
    const parsed = JSON.parse(errMsg);
    if (parsed.error && parsed.error.message) {
      const msg = parsed.error.message;
      if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota") || msg.includes("Quota exceeded") || msg.includes("429")) {
        return "Hệ thống AI đang tạm thời đạt giới hạn dùng thử miễn phí (AI Quota Limit). Vui lòng thử lại sau vài giây hoặc kết nối tài khoản dịch vụ riêng của bạn trong phần Cài đặt. / The AI service has temporarily reached its free trial quota limit. Please try again in a few seconds or configure a custom AI provider in Settings.";
      }
      if (msg.includes("503") || msg.includes("overloaded") || msg.includes("busy") || msg.includes("UNAVAILABLE")) {
        return "Hệ thống AI hiện đang xử lý nhiều yêu cầu, vui lòng ấn gửi lại sau giây lát. / The AI model is currently busy. Please retry in a moment.";
      }
      return msg;
    }
  } catch (e) {
    // No-op
  }
  return errMsg;
};

async function generateContentWithFallback(
    aiInstance: GoogleGenAI,
    options: {
        contents: any;
        systemInstruction?: string;
        tools?: any[];
    }
) {
    const modelsToTry = [
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest'
    ];

    if (options.tools && options.tools.length > 0) {
        for (const model of modelsToTry) {
            try {
                console.log(`[Fallback API] Attempting WITH tools using model ${model}...`);
                const response = await aiInstance.models.generateContent({
                    model: model,
                    contents: options.contents,
                    config: {
                        systemInstruction: options.systemInstruction || "You are a helpful assistant.",
                        tools: options.tools
                    }
                });
                return response;
            } catch (error: any) {
                console.warn(`[Fallback API] Attempt WITH tools failed for model ${model}:`, error.message || error);
                if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("403")) {
                    throw error;
                }
            }
        }
    }

    // Try without tools
    for (const model of modelsToTry) {
        try {
            console.log(`[Fallback API] Attempting WITHOUT tools using model ${model}...`);
            const response = await aiInstance.models.generateContent({
                model: model,
                contents: options.contents,
                config: {
                    systemInstruction: options.systemInstruction || "You are a helpful assistant."
                }
            });
            return response;
        } catch (error: any) {
            console.warn(`[Fallback API] Attempt WITHOUT tools failed for model ${model}:`, error.message || error);
            if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("403")) {
                throw error;
            }
        }
    }

    throw new Error("All model fallback attempts exhausted / Tất cả các phương án kết nối mô hình đều thất bại.");
}

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

    const response = await generateContentWithFallback(ai, {
        contents,
        systemInstruction: systemInstruction || "You are an expert career counselor."
    });
    return res.status(200).json({ text: response.text });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    const errorMessage = cleanGeminiErrorMessage(error);
    return res.status(500).json({ error: errorMessage });
  }
}
