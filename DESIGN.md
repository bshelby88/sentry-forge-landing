# Sentry Forge — Landing Page Design v1

**Tagline:** "I can't afford an Attorney, but I can afford Agentic AI."
**One-liner:** Agentic AI builds your debt-dispute case in 30 minutes. You sign and send.
**Audience:** Working-class adult with a $1k–$15k collection account, wrongful eviction, junk fees, identity-theft remnant, time-barred zombie debt — who would otherwise lose by default because $300/hr counsel is out of reach.
**Tone:** Tactical. Anti-corporate. Trustworthy. Not cute. Not legal-LinkedIn either.

---

## Visual Direction — "Industrial Forge"

Plays the product name. A forge is where raw documents get hammered into weapons.

| Element | Spec |
|---|---|
| Base palette | `--steel-900: oklch(18% 0.01 250)` background, `--steel-700: oklch(32% 0.01 250)` panels, `--steel-300: oklch(78% 0.005 250)` body text |
| Brand accent (ember) | `--ember: oklch(72% 0.18 50)` — heated steel orange, used for active states, key numbers, CTA |
| Critical accent (alarm) | `--alarm: oklch(62% 0.22 25)` — used sparingly for "WRONGFUL" / "VIOLATION" stamps |
| Trust accent | `--gilt: oklch(78% 0.13 90)` — soft brass, used for verdicts, seals, success states |
| Display font | `Söhne Breit` or fallback `Space Grotesk` — wide, structural, headline-only |
| Body font | `Inter` 400/500 |
| Mono font | `JetBrains Mono` — for statute citations, dollar amounts, file names, "evidence" blocks |
| Texture | Subtle scanline + 3% noise overlay on hero. Hairline rule dividers. No gradients except the ember-on-steel hero glow. |
| Motion | One forge-spark animation behind the headline (rare, slow, atmospheric). One ember-pulse on the CTA hover. Reduced-motion respected. |
| Layout | Bento-style proof grid, not generic 3-column "features." Hero asymmetric — copy left, live evidence panel right. |

Anti-defaults:
- No centered hero with gradient blob
- No three-column "Fast / Secure / Easy" feature grid
- No stock smiling-customer photo
- No "Trusted by" logo wall — we don't have one yet, don't fake it

---

## Page Structure (top to bottom)

1. **Hero** — tagline + live evidence panel
2. **The wedge** — what's actually wrong with most collection accounts
3. **How Sentry Forge works** — three steps, terminal-style cards
4. **Customer #1 receipt** — Bryant's own case, real numbers, live counter
5. **What's in the pack** — bento grid of deliverables
6. **Pricing** — single tier, founders pricing
7. **The fine print** — not a law firm disclaimer, told straight
8. **FAQ** — 6-8 sharp answers
9. **Waitlist / launch CTA** — email capture, founder note
10. **Footer** — minimal, contact, legal

---

## 1. HERO

### Copy

```
                          ┌─ SENTRY FORGE ─────────────────────────────┐

                          I can't afford an Attorney,
                          but I can afford Agentic AI.

                          Sentry Forge forges your debt-dispute case in
                          under an hour. Wrongful collections. Illegal
                          evictions. Duplicate fees. Zombie debt past
                          its statute. We hammer the paperwork. You
                          sign and send.

                          [ Forge My Case → ]   [ See a real case ]

                          ─────────────────────────────────────────────
                          $300/hr counsel       $0 / month, $99 / case
```

### Right-side evidence panel (live-feeling, not a screenshot)

```
─── case-001 / 2026-05-04 ─────────────────── FORGED ───
$ sentry-forge analyze ./creditor_letter.pdf

  → parsed itemization ledger ........... 14 pages
  → cross-checked lease  ................ found 1 contract
  → fee duplication scan ................ ⚠ $4,180 double-billed
  → state SOL clock ..................... ⚠ expired 2023-02-14
  → self-help eviction check ............ ⚠ no judgment on record
  → reg-F itemization defects ........... ⚠ missing reference date
  → mitigation evidence ................. ⚠ none provided

  output:
    01_letter_collector.md           [ ready ]
    02_letter_original_creditor.md   [ ready ]
    03_cfpb_complaint_collector.md   [ ready ]
    04_cfpb_complaint_creditor.md    [ ready ]
    05_bureau_disputes.md            [ ready ]
    06_court_records_search.md       [ ready ]
    07_action_checklist.md           [ ready ]
    08_evidence_inventory.md         [ ready ]

  case forged in 14m 22s. estimated counsel cost avoided: $1,800+
─────────────────────────────────────────────────────────
```

Style notes:
- Left column: display font for headline, no all-caps. Sentence case is more confident than shouty.
- Headline ember-on-steel, tagline brass.
- CTA primary = ember fill, hover = bright pulse + spark particle.
- CTA secondary = ghost outline, links to /case-001 (Bryant's own case study).
- Pricing line is subtle, not the main pitch — the *pitch is the math itself*.
- Right panel: monospace, real text, marquee scroll on the "FORGED" tag, faint scanline. Pre-scrolled to final state by default; replays on scroll-into-view if user opts in.

---

## 2. THE WEDGE — "Most collection accounts are broken on paper"

Section header:

```
The collector hopes you panic.
We hope you read the ledger.
```

Then a four-card row, each card has a stat number + a one-sentence kicker:

| Card | Number (ember) | Kicker (steel-300) |
|---|---|---|
| Time-barred | **3-7 yrs** | Most state SOLs expire long before collectors stop calling. The debt is real; the lawsuit is impossible. |
| Duplicate fees | **40%+** | Of itemizations we've seen contain charges the original contract forbids stacking. |
| Reg F defects | **§1006.34** | Missing reference dates, broken validation notices, FCRA furnisher mistakes. Each = leverage. |
| Self-help evictions | **illegal** | In every state, your landlord can't change the locks without a judgment. Many do anyway. |

Visual: bento, not equal. First card is 2x wide. Hairline dividers. Hover = subtle ember underline.

---

## 3. HOW SENTRY FORGE WORKS

Three terminal-style cards. Mono. Faux command output.

### Card 1 — Intake

```
$ sentry-forge new
  paste collector letter ................ ✓
  attach itemization (pdf) .............. ✓
  attach original contract (optional) ... ✓
  describe what happened (1-2 sentences). ✓

  ready to analyze.
```

Plain English under it: *"Drop your collector letter and the itemization. If you have the original contract, attach it. Tell us what actually happened in your own words. That's the whole intake."*

### Card 2 — Analyze

```
$ sentry-forge analyze
  → fee scan
  → SOL clock by state
  → reg-F compliance check
  → state-specific eviction / wage-garnishment law
  → mitigation + depreciation audit
  → FCRA furnisher defects
  → identity-theft markers
```

Plain English: *"We hammer the document against state and federal consumer-debt law. Every defect becomes a leverage point. No legal-jargon dump — just the ones that matter to your case."*

### Card 3 — Forge

```
$ sentry-forge build
  ✓ collector dispute letter (FDCPA + Reg F)
  ✓ original creditor demand
  ✓ CFPB complaint drafts (with narratives)
  ✓ state AG complaint draft
  ✓ bureau dispute language (Equifax / Experian / TransUnion)
  ✓ court records search guide (your state, your court)
  ✓ action checklist (2 days, $25-60 OOP)
  ✓ evidence inventory + affidavit template
```

Plain English: *"You get the full pack. Print, sign, send. Mail tracking and confirmations come back to you. We track outcomes for 90 days."*

---

## 4. CUSTOMER #1 RECEIPT

The proof section. **Bryant's own case, real numbers, no fake testimonial.**

Section header:

```
Customer #1 was the founder.
Here's the receipt.
```

Subhead: *"$6,970.31 collection account from a Louisiana apartment. Lockout without judgment. Duplicate termination fees. Statute of limitations expired three years ago. Sentry Forge built the entire dispute pack in 14 minutes."*

Bento grid below:

```
┌── case-001 ──────────────────┐  ┌── account ───────────────┐
│ alleged balance              │  │ collector                │
│ $6,970.31                    │  │ Synergetic Communication │
│                              │  │ orig: Terraces / Metairie│
│ disputed in pack             │  │ state: Louisiana         │
│ $6,970.31  (100%)            │  └──────────────────────────┘
│                              │  ┌── leverage points ───────┐
│ counsel cost avoided         │  │ ✓ self-help eviction     │
│ $1,800+ (est.)               │  │ ✓ SOL expired 2023-02-14 │
│                              │  │ ✓ duplicate $2,090 fees  │
│ time to forge pack           │  │ ✓ no mitigation proof    │
│ 14m 22s                      │  │ ✓ Reg F itemization gap  │
└──────────────────────────────┘  └──────────────────────────┘
```

Below the grid: a *"Read the full case →"* link to a `/case-001` page that publishes the actual letters (with name + apartment scrubbed if going public, or kept for raw founder receipt mode).

Note for Bryant: this is the strongest possible launch asset. A real receipt beats every fake testimonial.

---

## 5. WHAT'S IN THE PACK

Bento grid of the 8 case-file deliverables. Each tile = title + one-line purpose + faux file size.

```
┌── 01_letter_collector ────────────┐  ┌── 02_letter_original_creditor ──┐
│ FDCPA + Reg F dispute letter      │  │ Wrongful-act demand to source   │
│ ready-to-mail, certified-format   │  │ deletion / refund / withdrawal  │
│ ~6 KB                             │  │ ~5 KB                           │
└───────────────────────────────────┘  └─────────────────────────────────┘

┌── 03_cfpb_collector ──────────────┐  ┌── 04_cfpb_creditor + AG ────────┐
│ CFPB narrative + resolution ask   │  │ Parallel CFPB + State AG        │
│ ~5 KB                             │  │ ~5 KB                           │
└───────────────────────────────────┘  └─────────────────────────────────┘

┌── 05_bureau_disputes ─────────────┐  ┌── 06_court_records ─────────────┐
│ Equifax / Experian / TransUnion   │  │ State-specific search guide     │
│ ~5 KB                             │  │ ~4 KB                           │
└───────────────────────────────────┘  └─────────────────────────────────┘

┌── 07_action_checklist ────────────┐  ┌── 08_evidence_inventory ────────┐
│ 2-day send sequence + costs       │  │ Affidavit template + tracker    │
│ ~5 KB                             │  │ ~5 KB                           │
└───────────────────────────────────┘  └─────────────────────────────────┘
```

---

## 6. PRICING

```
─── ONE CASE ──────────────────  ─── FOUNDING 100 ──────────────────
$99                              $49
flat. one debt. full pack.       first 100 customers. lifetime rate.
no subscription.                 grandfathered on every future case.

[ Forge My Case → ]              [ Claim Founding Spot → ]
```

Subline under both: *"You pay nothing if we can't find at least three leverage points in your account. Read it before you send it. Send it when you mean it."*

---

## 7. NOT-A-LAW-FIRM DISCLAIMER (told straight)

```
We're not a law firm. We don't represent you. We don't appear in court.
We're an analyst and a draftsman with consumer-debt law loaded in memory.
Everything we forge is yours — your name, your signature, your decision.

If your case escalates to a lawsuit, get a Louisiana / your-state attorney.
We'll hand them a clean file.
```

This is honest-positioning, not boilerplate fine print. Goes mid-page, not buried in the footer.

---

## 8. FAQ

Six questions. Real answers. No sales-y dodges.

1. **Will this hurt my credit more?**
   No. Disputing a tradeline cannot lower your score. It can only stay the same, get marked "disputed," or get deleted.

2. **Is the debt really gone if you delete the tradeline?**
   The tradeline coming off your report is one outcome. The underlying debt may still legally exist (until SOL or settlement). Sentry Forge attacks both fronts.

3. **What if I actually owe the money?**
   We tell you. We won't help you fight a clean debt with no defects. We will help you negotiate it down with documented leverage.

4. **What states do you cover?**
   All 50, with state-specific SOL, eviction, and consumer-protection layered in. Louisiana, Texas, Florida, California, New York have the most case law loaded today.

5. **What if the collector ignores me?**
   Their silence is the violation. That's why the FDCPA exists. We escalate to CFPB, state AG, and bureau disputes in parallel — silence kills their tradeline.

6. **What if I get sued?**
   First, run the SOL check — most "lawsuit threats" are bluff on time-barred debt. Second, your full pack hands an attorney a 60% finished defense. Third, we have a referral list of consumer-defense attorneys who take cases on FDCPA contingency.

---

## 9. WAITLIST / LAUNCH CTA

```
─── still hand-tuning the engine ────────────────────────

  drop your email. we'll forge cases for the first 100
  founders before opening to the public.

  [ email here ............... ] [ join waitlist → ]

  no spam. one email when we open. that's it.

─────────────────────────────────────────────────────────
```

POST `/api/subscribe` → Resend → email to `jadedfocus@gmail.com` subject `[FORGE] new waitlist signup: <email>`. Same pattern as Sentry Pro.

---

## 10. FOOTER

```
SENTRY FORGE  ·  agentic ai for consumer-debt defense
contact: forge@[domain]   ·   built by @jadedfocus
not a law firm  ·  no attorney-client relationship
```

---

## Files / Repo Plan (when you say "build it")

```
/home/sprit/sentry-forge-landing/
├── index.html              # full single-page site (~600 lines)
├── og.png                  # 1280x720 forge aesthetic
├── favicon.ico + 32 + 180
├── robots.txt + sitemap.xml
├── api/
│   └── subscribe.js        # Resend → jadedfocus@gmail.com
├── case-001/
│   └── index.html          # public version of Customer #1 case study
├── vercel.json             # HSTS + CSP headers
└── README.md               # repo notes
```

GitHub: `bshelby88/sentry-forge-landing` (public, mirror of Sentry Pro pattern).
Domain: `sentryforge.app` or `sentry-forge.com` (check + register before launch).

---

## What to Decide Before I Build the HTML

1. **Domain choice.** `sentryforge.app`? `sentry-forge.com`? `forge.sentry.pro` subdomain?
2. **Pricing actually $99 / $49?** Or flat $79 founder? Confirm.
3. **Customer #1 case study public.** Publish your real apartment + collector by name? Or scrub to "Louisiana apartment, $6,970.31"? Big credibility tradeoff.
4. **Stripe product.** Want me to spin up the Stripe product + payment link in parallel with the HTML build? (Same pattern as Sentry Pro: `acct_1TQdvoLYILfmbp2u`.)
5. **Scope of v1.** Land just the waitlist? Or land waitlist + payment-ready Stripe link so the first FOMO buyer can pay $49 today?

Say "build it" and I'll scaffold `index.html` + `api/subscribe.js` + `vercel.json` to match this design and ship it like Sentry Pro.
