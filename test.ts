import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: "test" });
const s = ai.live.connect({ model: "test" });
s.then(session => {
  session.conn = { send: (msg) => console.log(msg) };
  session.sendRealtimeInput({ text: "Hello" });
}).catch(e => console.log(e));
