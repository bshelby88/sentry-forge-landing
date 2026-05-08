# Webhook Forge Starter Kit v1.0

Production-ready Stripe webhook + Resend email pipeline for Next.js.

## What's in the box

- `api/stripe-webhook.js` — full handler with HMAC sig verification, replay-attack guard, tier mapping, customer + founder email automation
- `.env.example` — template for env vars
- This README — 5-step setup guide
- LICENSE — MIT

## 5-step setup

### 1. Copy the file

**Pages router** (`pages/api/`):
- Copy `api/stripe-webhook.js` to `pages/api/stripe-webhook.js`

**App router** (`app/api/`):
- Copy to `app/api/stripe-webhook/route.js`
- Wrap default export as `POST` named export
- Use `await req.text()` instead of `readRawBody(req)`

### 2. Set env vars

Copy `.env.example` to `.env.local`:

```
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
FOUNDER_EMAIL=you@example.com
```

In Vercel project settings, add the same three vars under Production.

### 3. Register webhook in Stripe

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://yourdomain.com/api/stripe-webhook`
3. Events: select `checkout.session.completed`
4. Add → reveal Signing Secret → paste into `STRIPE_WEBHOOK_SECRET`
5. Redeploy

### 4. Customize tier mapping

Edit `api/stripe-webhook.js`:

```js
const PRODUCT_TIER = {
  prod_YOURPRODUCTID: { label: 'Starter', price: 1900 },
};
```

Edit `buildCustomerEmail` and `buildFounderEmail` for your tier copy.

### 5. Verify with $1 live test

1. Stripe Dashboard → create $1 test product → payment link
2. Buy yourself with real card
3. Vercel logs: 6× POST /api/stripe-webhook → 200 OK in <1s
4. Resend: customer + founder emails delivered
5. Refund the $1 in Stripe Dashboard

## Troubleshooting

**400 Invalid signature.** Most common cause is body-parser eating raw bytes. The included config disables Vercel's auto-parse (`bodyParser: false`). If you ported to App router, use `req.text()` for raw bytes.

**No emails fire.** Check Resend API key valid; check `FOUNDER_EMAIL` is set; check spam folder.

**Stripe events not arriving.** Webhook endpoint registered? Endpoint URL matches? Signing secret in env matches the one in Stripe Dashboard?

For deeper troubleshooting, see free signature diagnostic tool: https://sentry-forge-landing.vercel.app/webhook/diagnostic/

For full setup help (24h delivery, $199): https://sentry-forge-landing.vercel.app/webhook/

## Six deep-dive blog posts (recommended reading)

1. https://sentry-forge-landing.vercel.app/webhook/blog/stripe-400/ — root causes of 400 errors
2. https://sentry-forge-landing.vercel.app/webhook/blog/multiple-events/ — 6+ events per checkout
3. https://sentry-forge-landing.vercel.app/webhook/blog/retry-behavior/ — Stripe's retry schedule
4. https://sentry-forge-landing.vercel.app/webhook/blog/idempotency/ — duplicate-event handling
5. https://sentry-forge-landing.vercel.app/webhook/blog/testing-locally/ — Stripe CLI vs ngrok
6. https://sentry-forge-landing.vercel.app/webhook/blog/email-providers/ — Resend vs Postmark vs SendGrid

## License

MIT. Use commercially. Modify freely. Attribution appreciated but not required.

## Author

Bryant Shelby — @jadedfocus on X · jadedfocus@gmail.com · (504) 201-4195
sentry-forge-landing.vercel.app
