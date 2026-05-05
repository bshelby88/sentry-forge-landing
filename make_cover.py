#!/usr/bin/env python3
"""Sentry Forge cover image — 1280x720, industrial forge aesthetic.

Steel base, ember accent, brass for verdicts. Tagline + terminal-style
case-001 receipt panel.
"""
from PIL import Image, ImageDraw, ImageFont
import glob

W, H = 1280, 720

# palette mirrors site's design system
BG          = (12, 14, 18)        # steel-950
PANEL       = (24, 27, 33)        # steel-900
PANEL_DARK  = (8, 10, 14)
TXT         = (240, 242, 246)     # steel-100
MUTED       = (140, 150, 165)     # steel-500
DIM         = (95, 100, 112)
EMBER       = (250, 145, 80)      # ember
EMBER_BR    = (255, 175, 110)     # ember-bright
ALARM       = (235, 95, 80)
GILT        = (220, 195, 110)
VERDICT     = (130, 210, 160)
LINE        = (44, 50, 60)


def find_font(paths, size):
    for p in paths:
        for path in glob.glob(p):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


# Use what's available on Linux Mint baseline
mono_b = ["/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"]
mono_r = ["/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"]
sans_b = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]

f_brand    = find_font(mono_b, 22)
f_eyebrow  = find_font(mono_b, 16)
f_h1       = find_font(sans_b, 64)
f_h1_em    = find_font(sans_b, 64)
f_term     = find_font(mono_r, 17)
f_term_b   = find_font(mono_b, 17)
f_badge    = find_font(mono_b, 14)
f_url      = find_font(mono_r, 18)
f_price    = find_font(mono_b, 20)


img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# Subtle scanline overlay
for y in range(0, H, 3):
    d.line([(0, y), (W, y)], fill=(18, 20, 24))

# Ember radial-ish glow behind headline (fake with concentric rectangles)
for r, alpha in [(360, 28), (300, 36), (240, 46), (180, 56), (120, 70)]:
    cx, cy = 470, 360
    box = [cx - r, cy - r, cx + r, cy + r]
    glow_color = (
        BG[0] + (EMBER[0] - BG[0]) * alpha // 255,
        BG[1] + (EMBER[1] - BG[1]) * alpha // 255,
        BG[2] + (EMBER[2] - BG[2]) * alpha // 255,
    )
    d.ellipse(box, outline=glow_color, width=4)

# ── TOP BRAND BAR ────────────────────────────────────────────────────
d.rectangle([0, 0, W, 56], fill=PANEL_DARK)
d.line([(0, 56), (W, 56)], fill=LINE, width=1)

# brand mark (forge shield polygon)
mx, my = 48, 18
shield = [(mx + 11, my), (mx + 22, my + 7), (mx + 18, my + 22),
          (mx + 4, my + 22), (mx, my + 7)]
d.polygon(shield, fill=EMBER)
d.text((mx + 32, my - 1), "SENTRY", font=f_brand, fill=TXT)
d.text((mx + 32 + 95, my - 1), "//", font=f_brand, fill=EMBER)
d.text((mx + 32 + 95 + 26, my - 1), "FORGE", font=f_brand, fill=TXT)

# right-side status
status_x = W - 260
d.ellipse([status_x, 22, status_x + 12, 34], fill=VERDICT)
d.text((status_x + 22, 19), "FORGED IN 14M 22S", font=f_badge, fill=MUTED)

# ── EYEBROW ──────────────────────────────────────────────────────────
d.text((80, 120), "// agentic AI · consumer-debt defense · $99/case",
       font=f_eyebrow, fill=EMBER)

# ── HEADLINE (split 3 lines) ─────────────────────────────────────────
y = 158
d.text((80, y), "I can’t afford an", font=f_h1, fill=TXT)
y += 76
d.text((80, y), "Attorney,", font=f_h1, fill=TXT)
y += 76
d.text((80, y), "but I can afford", font=f_h1, fill=TXT)
y += 76
d.text((80, y), "Agentic AI.", font=f_h1_em, fill=EMBER)

# ── TERMINAL PANEL (right side, with case-001 receipt) ──────────────
panel_x, panel_y = 720, 130
panel_w, panel_h = W - panel_x - 80, 460
d.rectangle([panel_x, panel_y, panel_x + panel_w, panel_y + panel_h],
            fill=PANEL_DARK, outline=LINE, width=1)

# terminal title bar
d.rectangle([panel_x, panel_y, panel_x + panel_w, panel_y + 28], fill=PANEL)
d.line([(panel_x, panel_y + 28),
        (panel_x + panel_w, panel_y + 28)], fill=LINE, width=1)
d.ellipse([panel_x + 10, panel_y + 9, panel_x + 20, panel_y + 19], fill=(70, 70, 78))
d.ellipse([panel_x + 28, panel_y + 9, panel_x + 38, panel_y + 19], fill=(70, 70, 78))
d.ellipse([panel_x + 46, panel_y + 9, panel_x + 56, panel_y + 19], fill=VERDICT)
d.text((panel_x + 76, panel_y + 7), "case-001 / 2026-05-04", font=f_badge, fill=MUTED)
# FORGED badge top-right of bar
d.rectangle([panel_x + panel_w - 78, panel_y + 6,
             panel_x + panel_w - 12, panel_y + 22], fill=EMBER)
d.text((panel_x + panel_w - 73, panel_y + 7), "FORGED",
       font=f_badge, fill=PANEL_DARK)

# terminal content
tx = panel_x + 18
ty = panel_y + 48

# command line
d.text((tx, ty), "$ ", font=f_term_b, fill=EMBER)
d.text((tx + 22, ty), "sentry-forge analyze ./creditor.pdf",
       font=f_term, fill=TXT)
ty += 30

# parsed lines
def line(label, status, status_color, t=ty):
    d.text((tx, t), "→ ", font=f_term_b, fill=DIM)
    d.text((tx + 22, t), label, font=f_term, fill=TXT)
    d.text((tx + 22 + 270, t), status, font=f_term_b, fill=status_color)


line("itemization parsed",         "14 pages",        VERDICT, ty);  ty += 26
line("lease cross-checked",        "1 contract",      VERDICT, ty);  ty += 26
line("fee duplication scan",       "$4,180 doubled",  EMBER_BR, ty); ty += 26
line("state SOL clock",            "expired 2023",    EMBER_BR, ty); ty += 26
line("self-help eviction check",   "no judgment",     ALARM, ty);    ty += 26
line("reg-F itemization",          "missing ref date",EMBER_BR, ty); ty += 26
line("mitigation evidence",        "none provided",   EMBER_BR, ty); ty += 26

ty += 12
d.text((tx, ty), "output:", font=f_term, fill=DIM); ty += 26

files = ["01_letter_collector.md", "02_letter_creditor.md",
         "03_cfpb_collector.md",   "04_cfpb_creditor.md",
         "05_bureau_disputes.md",  "06_court_records.md",
         "07_action_checklist.md", "08_evidence.md"]
for fn in files:
    d.text((tx + 14, ty), fn, font=f_term, fill=TXT)
    d.text((tx + 14 + 280, ty), "[ ready ]", font=f_term_b, fill=VERDICT)
    ty += 22

# ── BOTTOM URL ROW ───────────────────────────────────────────────────
d.text((80, H - 110), "$300/hr counsel", font=f_price, fill=MUTED)
d.text((80 + 200, H - 110), "→", font=f_price, fill=EMBER)
d.text((80 + 230, H - 110), "$0/mo · $99/case",
       font=f_price, fill=GILT)
d.text((80 + 230 + 218, H - 110), "· first 100 founders $49",
       font=f_url, fill=DIM)

d.text((80, H - 50), "sentry-forge-landing.vercel.app",
       font=f_url, fill=EMBER)
d.text((W - 360, H - 50), "agentic AI for debt defense",
       font=f_url, fill=MUTED)


img.save("/home/sprit/sentry-forge-landing/og.png", "PNG", optimize=True)
print("saved og.png")
