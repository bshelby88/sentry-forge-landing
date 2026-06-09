// POST /api/intake — Webhook Starter Kit intake form receiver.
//
// Validates the JSON body, drops honeypot submissions, fires two Resend
// emails (founder alert + customer auto-confirm), and returns 200.
//
// Required Vercel env vars:
//   RESEND_API_KEY    Resend API key for transactional dispatch
//
// Optional env vars:
//   INTAKE_FORWARD_TO   Override founder destination (defaults to FOUNDER)

const FOUNDER_EMAIL = 'jadedfocus@gmail.com';

const ALLOWED_STACKS = new Set([
  'nextjs-vercel',
  'express-render',
  'hono-cloudflare',
  'sveltekit',
  'remix',
  'other',
]);

const FIELD_LIMITS = {
  customer_email: 200,
  customer_name: 120,
  company: 160,
  stack: 40,
  repo_url: 400,
  deploy_url: 400,
  products: 4000,
  customer_copy: 4000,
  founder_email: 200,
  notes: 4000,
};

function clean(value, max) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isHttpUrl(value) {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildFounderEmail(payload) {
  const lines = [
    `New Webhook Starter Kit intake.`,
    ``,
    `Customer:        ${payload.customer_email}`,
    `Name:            ${payload.customer_name || '—'}`,
    `Company:         ${payload.company || '—'}`,
    `Stack:           ${payload.stack}`,
    `Repo:            ${payload.repo_url}`,
    `Deploy URL:      ${payload.deploy_url || '—'}`,
    `Founder notify:  ${payload.founder_email}`,
    ``,
    `--- Merchant of Record products ---`,
    payload.products,
    ``,
    `--- Customer email copy preferences ---`,
    payload.customer_copy || '(none provided — use default tone)',
    ``,
    `--- Notes ---`,
    payload.notes || '(none)',
    ``,
    `--- Action (24h SLA running) ---`,
    `1. Reply to ${payload.customer_email} within 1 hour confirming receipt`,
    `2. Send secure-link channel for Merchant of Record webhook secret + email API key`,
    `3. Clone repo, drop in api/lemonsqueezy-webhook.js, adapt PRODUCT_TIER + email body`,
    `4. Deploy to their Vercel project`,
    `5. Run live webhook test, confirm 200 OK + emails fire`,
    `6. Send completion email with PR/commit link + 7-day support terms`,
  ];
  return lines.join('\n');
}

function buildCustomerEmail(payload) {
  return [
    `Hey${payload.customer_name ? ' ' + payload.customer_name.split(' ')[0] : ''},`,
    ``,
    `Got your intake for the Webhook Starter Kit. 24-hour SLA running.`,
    ``,
    `Within the next hour I'll reply with:`,
    ``,
    `  1. A secure one-time link to send your Stripe webhook signing secret`,
    `     and email-provider API key (don't paste them in email)`,
    `  2. Confirmation of the stack you picked: ${payload.stack}`,
    `  3. Repo invite request (if private) — GitHub user: bshelby88`,
    ``,
    `Within 24 hours of secrets arriving:`,
    ``,
    `  - PR opened against ${payload.repo_url}`,
    `  - Live $1 test charge fired in front of you, then refunded`,
    `  - Customer + founder emails confirmed delivering via Resend`,
    `  - 7-day support window starts`,
    ``,
    `Refund policy: full refund if I miss the 24-hour SLA after secrets arrive.`,
    ``,
    `If you don't hear from me within 1 hour, email jadedfocus@gmail.com directly.`,
    ``,
    `— Bryant`,
    `Sentry Forge — https://sentryforge.royalruby.io/webhook/`,
  ].join('\n');
}

async function sendResendEmail({ apiKey, to, subject, text, replyTo }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Sentry Forge <bryant@mail.royalruby.io>',
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => '');
    throw new Error(`resend ${r.status}: ${err.slice(0, 200)}`);
  }
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('intake missing RESEND_API_KEY');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // Honeypot
  if (typeof body.hp_field === 'string' && body.hp_field.trim() !== '') {
    // Pretend success to avoid signaling the bot
    return res.status(200).json({ received: true });
  }

  const payload = {
    customer_email: clean(body.customer_email, FIELD_LIMITS.customer_email),
    customer_name: clean(body.customer_name, FIELD_LIMITS.customer_name),
    company: clean(body.company, FIELD_LIMITS.company),
    stack: clean(body.stack, FIELD_LIMITS.stack),
    repo_url: clean(body.repo_url, FIELD_LIMITS.repo_url),
    deploy_url: clean(body.deploy_url, FIELD_LIMITS.deploy_url),
    products: clean(body.products, FIELD_LIMITS.products),
    customer_copy: clean(body.customer_copy, FIELD_LIMITS.customer_copy),
    founder_email: clean(body.founder_email, FIELD_LIMITS.founder_email),
    notes: clean(body.notes, FIELD_LIMITS.notes),
  };

  // Required-field validation
  const errors = [];
  if (!isEmail(payload.customer_email)) errors.push('customer_email');
  if (!ALLOWED_STACKS.has(payload.stack)) errors.push('stack');
  if (!isHttpUrl(payload.repo_url)) errors.push('repo_url');
  if (!payload.products) errors.push('products');
  if (!isEmail(payload.founder_email)) errors.push('founder_email');
  if (payload.deploy_url && !isHttpUrl(payload.deploy_url)) errors.push('deploy_url');

  if (errors.length > 0) {
    return res.status(400).json({
      error: `Invalid or missing: ${errors.join(', ')}`,
    });
  }

  const founderTo = process.env.INTAKE_FORWARD_TO || FOUNDER_EMAIL;
  const replyInbox = 'bryant@royalruby.io';

  try {
    await Promise.all([
      sendResendEmail({
        apiKey: resendKey,
        to: founderTo,
        subject: `[FORGE INTAKE] Webhook Kit — ${payload.customer_email} (${payload.stack})`,
        text: buildFounderEmail(payload),
        replyTo: payload.customer_email,
      }),
      sendResendEmail({
        apiKey: resendKey,
        to: payload.customer_email,
        subject: `Sentry Forge — intake received (24h SLA running)`,
        text: buildCustomerEmail(payload),
        replyTo: replyInbox,
      }),
    ]);
  } catch (e) {
    console.error('intake email dispatch failed', e);
    return res.status(500).json({
      error: 'Email dispatch failed. Email bryant@royalruby.io directly.',
    });
  }

  return res.status(200).json({ received: true });
}
