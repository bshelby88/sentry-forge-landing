// POST /api/stripe-webhook — Stripe → Sentry Forge payment automation.
//
// Verifies the Stripe signature, extracts the paid customer's email and
// tier, and dispatches two emails via Resend:
//   1. Customer: "your case is open" + intake instructions
//   2. Founder (jadedfocus@gmail.com): "case paid — start forge"
//
// No Stripe SDK dep — sig verification is HMAC-SHA256 against the raw
// payload + timestamp, per Stripe webhook docs.
//
// Required Vercel env vars:
//   STRIPE_WEBHOOK_SECRET   whsec_*** from Stripe dashboard endpoint
//   RESEND_API_KEY          (already in place from waitlist)
//
// Stripe dashboard config:
//   Endpoint URL: https://sentry-forge-landing.vercel.app/api/stripe-webhook
//   Listen for:   checkout.session.completed

import crypto from 'node:crypto';

// Disable Vercel's automatic JSON parsing — Stripe sig requires raw bytes
export const config = {
  api: {
    bodyParser: false,
  },
};

// Map Stripe product IDs → tier label for email copy.
// Update if products change.
const PRODUCT_TIER = {
  prod_USSfIfOqde9WJZ: { label: 'One Case', price: 7900 },
  prod_USSfi26Dx2sRtn: { label: 'Founding 100', price: 2900 },
  prod_UTa9dqJ4oenN6L: { label: 'Webhook Service', price: 19900 },
  prod_UTa9lDfncXGlPK: { label: 'Dispute Letter', price: 4900 },
};

const FOUNDER_EMAIL = 'jadedfocus@gmail.com';
const TOLERANCE_SECONDS = 5 * 60; // 5-min replay-attack window

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifySignature(rawBody, header, secret) {
  if (!header || !secret) return false;

  const parts = header.split(',').reduce((acc, p) => {
    const [k, v] = p.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const timestamp = parseInt(parts.t, 10);
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  // Replay-attack guard
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > TOLERANCE_SECONDS) return false;

  const signed = `${timestamp}.${rawBody.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');

  // Constant-time compare
  const expBuf = Buffer.from(expected, 'hex');
  const sigBuf = Buffer.from(signature, 'hex');
  if (expBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(expBuf, sigBuf);
}

async function sendResendEmail({ apiKey, to, subject, text, replyTo }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Sentry Forge <onboarding@resend.dev>',
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

function buildCustomerEmail({ tier, email }) {
  return [
    `Hey,`,
    ``,
    `Your Sentry Forge case is open. We received your payment for the ${tier} tier.`,
    ``,
    `Reply to this email with:`,
    ``,
    `  1. The collector letter you received (PDF or paste of email)`,
    `  2. The original contract or lease (if you have it)`,
    `  3. Two or three sentences in your own words about what actually happened`,
    `  4. Your state (2-letter)`,
    `  5. Approximate date you defaulted, moved out, or last paid`,
    ``,
    `As soon as we have that, we forge the pack: 8 ready-to-send`,
    `deliverables — collector dispute letter, original-creditor demand,`,
    `CFPB complaints, bureau dispute language, court records search`,
    `guide, action checklist, evidence inventory.`,
    ``,
    `Turnaround: under 24 hours from intake.`,
    ``,
    `Quick reminders:`,
    ``,
    `  - We're not a law firm. No attorney-client relationship.`,
    `  - Read every letter before you sign or send it.`,
    `  - For litigation, get a licensed attorney in your state — your`,
    `    pack is a 60% finished defense for them.`,
    ``,
    `If you don't hear from us within 24 hours, email forge@sentryforge.app.`,
    ``,
    `— Bryant`,
    `Sentry Forge`,
    `https://sentry-forge-landing.vercel.app`,
  ].join('\n');
}

function buildFounderEmail({ tier, email, sessionId, amount }) {
  return [
    `New paid Sentry Forge customer.`,
    ``,
    `Tier:        ${tier}`,
    `Customer:    ${email}`,
    `Amount:      $${(amount / 100).toFixed(2)}`,
    `Session ID:  ${sessionId}`,
    ``,
    `Action:`,
    `  1. Reply to ${email} confirming receipt + ask for the 5 intake items`,
    `  2. Once intake arrives, run:`,
    `       sentry-forge run cases/<slug> \\`,
    `         --collector-letter ./inbox/<file>.pdf \\`,
    `         --contract ./inbox/<file>.pdf \\`,
    `         --narrative "..." \\`,
    `         --customer-name "..." \\`,
    `         --state XX \\`,
    `         --default-date YYYY-MM-DD \\`,
    `         --alleged-balance N`,
    `  3. Email the pack/ folder back to ${email}`,
    ``,
    `Stripe session: https://dashboard.stripe.com/payments/${sessionId}`,
  ].join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const resendKey = process.env.RESEND_API_KEY;
  if (!webhookSecret || !resendKey) {
    console.error('webhook missing env vars');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (e) {
    return res.status(400).json({ error: 'Body read failed' });
  }

  const sigHeader = req.headers['stripe-signature'];
  if (!verifySignature(rawBody, sigHeader, webhookSecret)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // We only care about successful checkouts
  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true, ignored: event.type });
  }

  const session = event.data?.object || {};
  const email =
    session.customer_details?.email ||
    session.customer_email ||
    'unknown@unknown';

  // Stripe puts the line item product on session.line_items but that
  // requires an extra API expand. Fall back to amount-based tier inference.
  const amount = session.amount_total || 0;
  let tier = 'One Case';
  if (amount === 2900) tier = 'Founding 100';
  if (amount === 7900) tier = 'One Case';
  if (amount === 19900) tier = 'Webhook Service';
  if (amount === 4900) tier = 'Dispute Letter';

  const sessionId = session.id || 'unknown';

  try {
    await Promise.all([
      // Customer-facing email — temporarily routed to founder inbox until
      // a domain is verified in Resend. Founder forwards to `email` manually.
      // Subject prefix [FORWARD TO …] makes the routing obvious in inbox.
      sendResendEmail({
        apiKey: resendKey,
        to: FOUNDER_EMAIL,
        subject: `[FORWARD TO ${email}] Sentry Forge — your case is open (${tier})`,
        text: buildCustomerEmail({ tier, email }),
        replyTo: FOUNDER_EMAIL,
      }),
      sendResendEmail({
        apiKey: resendKey,
        to: FOUNDER_EMAIL,
        subject: `[FORGE PAID] ${tier} — ${email} — $${(amount / 100).toFixed(2)}`,
        text: buildFounderEmail({ tier, email, sessionId, amount }),
        replyTo: email,
      }),
    ]);
  } catch (e) {
    console.error('email dispatch failed', e);
    // Return 200 so Stripe doesn't retry indefinitely; alert via log
    return res.status(200).json({ received: true, email_error: String(e) });
  }

  return res.status(200).json({ received: true, tier, email });
}
