// POST /api/subscribe — Sentry Forge waitlist capture, notifies via Resend
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, source = 'landing', case_type = '' } = req.body || {};

  if (!email || typeof email !== 'string' || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  if (email.length > 256) {
    return res.status(400).json({ error: 'Email too long' });
  }
  if (typeof source !== 'string' || source.length > 64) {
    return res.status(400).json({ error: 'Invalid source' });
  }
  if (typeof case_type !== 'string' || case_type.length > 64) {
    return res.status(400).json({ error: 'Invalid case_type' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  const ts = new Date().toISOString();

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sentry Forge <onboarding@resend.dev>',
        to: ['jadedfocus@gmail.com'],
        reply_to: email,
        subject: `[FORGE] new waitlist signup: ${email}`,
        text: [
          `New Sentry Forge waitlist signup`,
          ``,
          `Email:     ${email}`,
          `Source:    ${source}`,
          `Case type: ${case_type || '(not specified)'}`,
          `Time:      ${ts}`,
          `IP:        ${ip}`,
          `UA:        ${ua}`,
          ``,
          `Landing:   https://sentry-forge-landing.vercel.app`,
        ].join('\n'),
      }),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      console.error('Resend error', r.status, errText);
      return res.status(500).json({ error: 'Notification failed' });
    }
  } catch (err) {
    console.error('Resend exception', err);
    return res.status(500).json({ error: 'Notification failed' });
  }

  return res.status(200).json({ ok: true, message: 'on the waitlist. forge opens to first 100 founders.' });
}
