# Sentry Forge — landing

> Stripe webhook monitoring & setup SaaS. $199 setup, $29/mo monitoring, $2500+$499/mo enterprise.

Sentry Forge monitors your Stripe webhooks, alerts on failures, and handles
full integration setup so you never miss a payment event.

## Stack

- Static `index.html` (single page, no framework)
- Vercel Functions: `api/subscribe.js` (Resend → jadedfocus@gmail.com)
- Vercel hosting, HSTS + CSP via `vercel.json`
- Resend for waitlist notifications
- Stripe for setup and monitoring payment links

## Local dev

```bash
cd /home/sprit/sentry-forge-landing
python3 -m http.server 8000
# open http://localhost:8000
```

The API route only runs on Vercel — locally the form will return 404.

## Env vars (Vercel)

| Var | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API key (waitlist + Stripe webhook emails) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_***` from Stripe dashboard webhook endpoint |

## Deploy

```bash
vercel --prod
```

## Pricing

| Tier | Price | Description |
|---|---|---|
| Setup | $199 one-time | Webhook integration setup |
| Monitoring | $29/mo | Ongoing webhook monitoring & alerts |
| Enterprise | $2,500 + $499/mo | Full managed integration + SLA |

## Files

```
.
├── index.html              main landing
├── api/
│   └── subscribe.js        waitlist → Resend
├── vercel.json             headers + CSP
├── robots.txt
├── sitemap.xml
├── README.md               this file
└── DESIGN.md               full design rationale + future page sections
```

## Related

- Sister product: Sentry Pro (Telegram breach watchdog) at
  `/home/sprit/sentry-pro-landing/`
- Sentry Forge memory: `~/.claude/projects/-home-sprit/memory/project_sentry_forge.md`
