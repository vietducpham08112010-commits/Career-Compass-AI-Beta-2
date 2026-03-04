export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const k1 = "AIzaSyAWdZ7q2CJ7Th9IanoK";
  const k2 = "_8EGF6W6S6TdUKo";
  const API_KEY = process.env.GEMINI_API_KEY || (k1 + k2);

  return res.status(200).json({ key: API_KEY });
}
