# Vercel Functions

## `subscribe.js`

POST `/api/subscribe` — waitlist capture. Body: `{ email, source?, case_type? }`. Notifies via Resend → `jadedfocus@gmail.com`.

Required env: `RESEND_API_KEY`.

## `stripe-webhook.js`

POST `/api/stripe-webhook` — Stripe payment-success automation.

Listens for: `checkout.session.completed`.

On a paid checkout, dispatches two emails:
- **Customer:** "your case is open" + intake instructions (5 items requested)
- **Founder (jadedfocus@gmail.com):** payment receipt + ready-to-paste `sentry-forge run` command for the engine CLI

Required env: `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`.

### Stripe dashboard setup

1. Stripe → Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://sentry-forge-landing.vercel.app/api/stripe-webhook`
3. Listen for: `checkout.session.completed`
4. Copy the signing secret (`whsec_***`)
5. Vercel → Project Settings → Environment Variables → add `STRIPE_WEBHOOK_SECRET=whsec_***` (Production)
6. Redeploy production

### Test

After deploying, send a test event from the Stripe dashboard webhook page. Watch for:
- 200 in Stripe webhook delivery log
- Email from Resend in `jadedfocus@gmail.com` inbox

### Tier detection

Tier is inferred from `amount_total` (4900¢ → "Founding 100", 9900¢ → "One Case"). When prices change, update `PRODUCT_TIER` map and the if-chain in `handler()`.
