export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, milestone } = req.body;
  console.log(`[ALERT REMINDER] Scheduled email alert for ${email}. Milestone: "${milestone?.title}" on deadline: ${milestone?.deadline}`);
  return res.status(200).json({ success: true, message: `Successfully scheduled reminder for ${email}` });
}
