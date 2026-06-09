// POST /api/lemonsqueezy-webhook — Lemon Squeezy → Sentry Forge fulfillment.
//
// Verifies the Lemon Squeezy X-Signature header (HMAC-SHA256 of the raw
// request body using the per-store signing secret), then routes order
// + subscription events to fulfillment + dual email dispatch via Resend.
//
// Required Vercel env vars:
//   LEMONSQUEEZY_WEBHOOK_SECRET   signing secret from LS dashboard
//   RESEND_API_KEY                already configured for Stripe path
//
// Lemon Squeezy dashboard config:
//   Endpoint URL: https://sentryforge.royalruby.io/api/lemonsqueezy-webhook
//   Subscribed events:
//     order_created
//     order_refunded
//     subscription_created
//     subscription_updated
//     subscription_cancelled
//     subscription_payment_success
//     subscription_payment_failed
//
// Variant IDs below are placeholders. Populate after products created in LS.

import crypto from 'node:crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Map LS variant IDs → tier label. Source: LS API GET /v1/variants.
// Test-mode IDs from store id 70720094. Re-pull after KYC approval and
// switch to live mode.
const VARIANT_TIER = {
  '1637122': { label: 'Webhook Starter Kit', price: 19900, type: 'one_time' },
  '1637144': { label: 'Webhook Health Monitor', price: 2900, type: 'subscription' },
  '1683073': { label: 'Sentry Forge', price: 7900, type: 'one_time' },
};

const FOUNDER_EMAIL = 'jadedfocus@gmail.com';

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

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expBuf = Buffer.from(expected, 'hex');
  let sigBuf;
  try {
    sigBuf = Buffer.from(header, 'hex');
  } catch {
    return false;
  }

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

function buildCustomerEmail({ tier, email, eventName }) {
  if (tier === 'Webhook Starter Kit') {
    return [
      `Hey,`,
      ``,
      `Got your $199 for the Webhook Starter Kit. 24-hour SLA starts when`,
      `you reply with the intake brief below.`,
      ``,
      `Reply to this email with:`,
      ``,
      `  1. Framework + host (Next.js on Vercel, Hono on Cloudflare, etc.)`,
      `  2. GitHub repo URL + invite to bshelby88 (or send patch back if private)`,
      `  3. Webhook signing secret (e.g., from Lemon Squeezy, Stripe, etc.)`,
      `  4. Resend API key (re_***) OR your preferred email provider`,
      `  5. Tier copy — what should the customer email say for each product tier/variant?`,
      `  6. Founder notification email (where purchase notifications land)`,
      ``,
      `Once that's in my inbox, I:`,
      ``,
      `  - Add api/lemonsqueezy-webhook.js (or .ts) with HMAC sig verification`,
      `  - Wire tier mapping for each of your products/variants`,
      `  - Add customer + founder email automation`,
      `  - Deploy to your Vercel project (or hand off if you self-deploy)`,
      `  - Run a live webhook test with you`,
      ``,
      `7-day support: any sig-verification or email-fire bug in my code, I fix free.`,
      ``,
      `Refund policy: full refund if I miss the 24-hour SLA.`,
      ``,
      `— Bryant`,
      `Sentry Forge — https://sentryforge.royalruby.io/webhook/`,
    ].join('\n');
  }

  if (tier === 'Webhook Health Monitor') {
    return [
      `Hey,`,
      ``,
      `Webhook Health Monitor activated. First synthetic event will fire`,
      `within 60 seconds of you pasting your endpoint into the dashboard.`,
      ``,
      `Reply to this email with:`,
      ``,
      `  1. Webhook endpoint URL`,
      `  2. Webhook signing secret (we use this to sign synthetic events)`,
      `  3. Alert destination — email + Slack webhook URL (optional)`,
      `  4. Polling interval: 5min default, 1min available on Team tier`,
      ``,
      `Once setup arrives:`,
      ``,
      `  - Synthetic event dispatch begins immediately`,
      `  - Alerts fire on any non-2xx response`,
      `  - 30-day audit log accessible via dashboard`,
      ``,
      `Cancel anytime. Prorated refund within first 14 days.`,
      ``,
      `— Bryant`,
      `Sentry Forge — https://sentryforge.royalruby.io/webhook/health-check`,
    ].join('\n');
  }

  if (tier === 'Letter Forge') {
    return [
      `Hey,`,
      ``,
      `Got your $49 for Letter Forge. 24-hour turnaround starts when you`,
      `reply with the intake below.`,
      ``,
      `Reply to this email with:`,
      ``,
      `  1. The letter or notice you received (PDF, photo, or paste)`,
      `  2. Your full legal name + mailing address (for the signature line)`,
      `  3. 2-3 sentences in your own words about what happened`,
      `  4. Your state (2-letter)`,
      `  5. Approximate date you defaulted, moved out, or last paid`,
      `  6. What specifically you want disputed`,
      ``,
      `PDF + DOCX delivered within 24 hours. Print, sign, mail certified.`,
      ``,
      `— Bryant`,
      `Sentry Forge — https://sentryforge.royalruby.io/letter`,
    ].join('\n');
  }

  if (tier === 'One Case' || tier === 'Founding 100') {
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
      `Billing & Processing: Your order has been successfully billed.`,
      `Your custom compilation pack will be fully compiled and delivered`,
      `within 10-15 minutes of submitting your details.`,
      ``,
      `Quick reminders:`,
      ``,
      `  - We're not a law firm. No attorney-client relationship.`,
      `  - Read every letter before you sign or send it.`,
      `  - For litigation, get a licensed attorney in your state — your`,
      `    pack is a 60% finished defense for them.`,
      ``,
      `If you don't hear from us within 24 hours, email jadedfocus@gmail.com.`,
      ``,
      `— Bryant`,
      `Sentry Forge`,
      `https://sentryforge.royalruby.io`,
    ].join('\n');
  }

  return [
    `Hey,`,
    ``,
    `Payment received (${eventName}). I'll follow up within 24 hours with`,
    `next steps.`,
    ``,
    `— Bryant`,
    `Sentry Forge — https://sentryforge.royalruby.io`,
  ].join('\n');
}

function buildFounderEmail({ tier, email, orderId, amount, eventName }) {
  const head = [
    `New paid customer.`,
    ``,
    `Event:       ${eventName}`,
    `Tier:        ${tier}`,
    `Customer:    ${email}`,
    `Amount:      $${(amount / 100).toFixed(2)}`,
    `Order ID:    ${orderId}`,
    ``,
  ];

  let action;
  if (tier === 'Webhook Starter Kit') {
    action = [
      `Action (24-hour SLA starts now):`,
      `  1. Reply to ${email} with intake brief — framework, host, repo,`,
      `     webhook signing secret, Resend key, tier copy, founder email`,
      `  2. Once intake arrives, clone repo, drop in api/lemonsqueezy-webhook.js,`,
      `     adapt PRODUCT_TIER map + customer email body, deploy to their Vercel`,
      `  3. Run live webhook test → confirm 200 OK + emails fire`,
      `  4. Send completion email with PR/commit link, env-var checklist,`,
      `     7-day support window`,
    ];
  } else if (tier === 'Webhook Health Monitor') {
    action = [
      `Action:`,
      `  1. Reply to ${email} with the 4-item setup template`,
      `  2. Once endpoint + signing secret arrive, register monitor in admin`,
      `  3. Confirm first synthetic event fires within 60s`,
      `  4. Send dashboard URL + alert config back to customer`,
    ];
  } else if (tier === 'Letter Forge') {
    action = [
      `Action (24-hour SLA from intake reply):`,
      `  1. Reply to ${email} with the 6-item intake template`,
      `  2. Draft letter from existing template (Letter 02 / 04 / 09)`,
      `  3. Render PDF + DOCX, anonymize, attach back to customer`,
    ];
  } else if (tier === 'One Case' || tier === 'Founding 100') {
    action = [
      `Action (24-hour SLA from intake reply):`,
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
    ];
  } else {
    action = [
      `Action:`,
      `  1. Reply to ${email} confirming receipt + ask for intake details`,
    ];
  }

  return [
    ...head,
    ...action,
    ``,
    `Lemon Squeezy order: https://app.lemonsqueezy.com/orders/${orderId}`,
  ].join('\n');
}

function extractOrderContext(payload) {
  const data = payload?.data || {};
  const attrs = data.attributes || {};
  const variantId =
    attrs.variant_id ||
    attrs.first_order_item?.variant_id ||
    attrs.first_subscription_item?.variant_id;

  const variantKey = variantId != null ? String(variantId) : null;
  const tierEntry = variantKey ? VARIANT_TIER[variantKey] : null;

  const variantName = attrs.variant_name || attrs.first_order_item?.variant_name;
  const productName = attrs.product_name || attrs.first_order_item?.product_name;
  let tier = tierEntry?.label || variantName || productName || 'Unknown';

  const amount =
    attrs.total ||
    attrs.subtotal ||
    tierEntry?.price ||
    0;

  if (variantKey === '1683073' || tier === 'Sentry Forge') {
    if (amount === 2900) {
      tier = 'Founding 100';
    } else if (amount === 7900) {
      tier = 'One Case';
    }
  }

  const email =
    attrs.user_email ||
    attrs.customer_email ||
    'unknown@unknown';

  const orderId = data.id || attrs.identifier || 'unknown';

  return { variantKey, tier, amount, email, orderId };
}

const FULFILL_EVENTS = new Set([
  'order_created',
  'subscription_created',
  'subscription_payment_success',
]);

const NOTIFY_ONLY_EVENTS = new Set([
  'order_refunded',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_payment_failed',
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const resendKey = process.env.RESEND_API_KEY;
  if (!webhookSecret || !resendKey) {
    console.error('lemonsqueezy webhook missing env vars');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch {
    return res.status(400).json({ error: 'Body read failed' });
  }

  const sigHeader =
    req.headers['x-signature'] ||
    req.headers['X-Signature'] ||
    '';
  if (!verifySignature(rawBody, sigHeader, webhookSecret)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const eventName = payload?.meta?.event_name || 'unknown';

  if (!FULFILL_EVENTS.has(eventName) && !NOTIFY_ONLY_EVENTS.has(eventName)) {
    return res.status(200).json({ received: true, ignored: eventName });
  }

  const { tier, amount, email, orderId } = extractOrderContext(payload);

  if (NOTIFY_ONLY_EVENTS.has(eventName)) {
    try {
      await sendResendEmail({
        apiKey: resendKey,
        to: FOUNDER_EMAIL,
        subject: `[FORGE ${eventName.toUpperCase()}] ${tier} — ${email}`,
        text: buildFounderEmail({ tier, email, orderId, amount, eventName }),
        replyTo: email,
      });
    } catch (e) {
      console.error('notify dispatch failed', e);
    }
    return res.status(200).json({ received: true, event: eventName });
  }

  const replyInbox = 'bryant@royalruby.io';

  try {
    await Promise.all([
      sendResendEmail({
        apiKey: resendKey,
        to: email,
        subject: `Sentry Forge — ${tier} (${eventName})`,
        text: buildCustomerEmail({ tier, email, eventName }),
        replyTo: replyInbox,
      }),
      sendResendEmail({
        apiKey: resendKey,
        to: FOUNDER_EMAIL,
        subject: `[FORGE PAID] ${tier} — ${email} — $${(amount / 100).toFixed(2)}`,
        text: buildFounderEmail({ tier, email, orderId, amount, eventName }),
        replyTo: email,
      }),
    ]);
  } catch (e) {
    console.error('email dispatch failed', e);
    return res.status(200).json({ received: true });
  }

  return res.status(200).json({ received: true, event: eventName });
}
