# Sentry Forge — landing

> "I can't afford an Attorney, but I can afford Agentic AI." — Sentry Forge

Agentic AI for consumer-debt defense. Builds a complete dispute pack
(collector letter, original-creditor demand, CFPB drafts, bureau
disputes, court-records guide, action checklist) for $99 per case.

## Stack

- Static `index.html` (single page, no framework)
- `case-001/index.html` (founder case study)
- Vercel Functions: `api/subscribe.js` (Resend → jadedfocus@gmail.com)
- Vercel hosting, HSTS + CSP via `vercel.json`
- Resend for waitlist notifications
- Stripe for `$49 founding` and `$99 case` payment links

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
| `RESEND_API_KEY` | Resend API key (re-use vault-pro / sentry-pro key) |

## Deploy

```bash
vercel --prod
```

## Stripe (live, account `acct_1TQdvoLYILfmbp2u`)

| Product | Price | Stripe ID | Payment link |
|---|---|---|---|
| Sentry Forge — One Case | $99 | `prod_USSfIfOqde9WJZ` / `price_1TTXkcLYILfmbp2uIXkUSxCC` | https://buy.stripe.com/6oU5kEcqoeosapG2VBfjG01 |
| Sentry Forge — Founding 100 | $49 | `prod_USSfi26Dx2sRtn` / `price_1TTXkgLYILfmbp2uIX9KxTqy` | https://buy.stripe.com/7sY9AU3TS4NS8hy2VBfjG02 |

## Files

```
.
├── index.html              main landing
├── case-001/
│   └── index.html          founder case study (Bryant Shelby, $6,970.31)
├── api/
│   └── subscribe.js        waitlist → Resend
├── vercel.json             headers + CSP
├── robots.txt
├── sitemap.xml
├── README.md               this file
└── DESIGN.md               full design rationale + future page sections
```

## Source case

Customer #1 case file (private, founder dogfood):
`/home/sprit/Desktop/SentryForge_Shelby_TerracesDispute/`

## Related

- Sister product: Sentry Pro (Telegram breach watchdog) at
  `/home/sprit/sentry-pro-landing/`
- Sentry Forge memory: `~/.claude/projects/-home-sprit/memory/project_sentry_forge.md`
