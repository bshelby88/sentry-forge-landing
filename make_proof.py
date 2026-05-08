#!/usr/bin/env python3
"""Sentry Forge proof-pack image — anonymized document stack for hero/social.

Renders 3 document sheets fanned out at angles, with realistic-looking
heading + redaction bars + signature line. Top sheet stamped FORGED.
Sized 1600x1000 for retina-quality web embed.

Each doc represents one deliverable from the actual case-001 pack:
  1. Validation demand letter (FDCPA §1692g)
  2. CFPB complaint narrative
  3. Bureau dispute language

No real names, addresses, or amounts. All redaction bars where PII
would appear. The aesthetic is photorealistic — looks like a physical
stack of legal docs sitting on a steel desk.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import glob
import math

W, H = 1600, 1000

# Palette mirrors site design system
BG          = (12, 14, 18)
PANEL_DARK  = (8, 10, 14)
TXT         = (240, 242, 246)
MUTED       = (140, 150, 165)
DIM         = (95, 100, 112)
EMBER       = (250, 145, 80)
EMBER_BR    = (255, 175, 110)
GILT        = (220, 195, 110)
ALARM       = (235, 95, 80)
LINE        = (44, 50, 60)

# Paper colors
PAPER       = (244, 240, 230)        # warm off-white
PAPER_DARK  = (216, 208, 188)        # shadow edge
PAPER_INK   = (28, 32, 38)
PAPER_DIM   = (140, 140, 145)
REDACT      = (24, 26, 30)


def find_font(paths, size):
    for p in paths:
        for path in glob.glob(p):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


mono_b = ["/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"]
mono_r = ["/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"]
serif_b = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
]
serif_r = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
]
sans_b = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]


def make_document(width, height, title, subtitle, body_lines, stamp=None):
    """Render a single sheet. Returns RGBA image."""
    sheet = Image.new("RGBA", (width, height), (*PAPER, 255))
    d = ImageDraw.Draw(sheet)

    # Subtle paper grain noise — vertical lines very faint
    for i in range(0, width, 7):
        d.line([(i, 0), (i, height)], fill=(238, 234, 224))

    # Top dark band (legal letterhead style)
    d.rectangle([0, 0, width, 6], fill=PAPER_INK)

    # Header block
    f_title = find_font(serif_b, 38)
    f_sub = find_font(mono_r, 18)
    f_body_b = find_font(mono_b, 18)
    f_body_r = find_font(mono_r, 18)

    pad = 56
    y = 38
    d.text((pad, y), title, font=f_title, fill=PAPER_INK)
    y += 56
    d.text((pad, y), subtitle, font=f_sub, fill=PAPER_DIM)
    y += 32
    d.line([(pad, y), (width - pad, y)], fill=PAPER_DIM, width=1)
    y += 28

    # "Sender / Recipient" redacted block
    d.text((pad, y), "FROM:", font=f_body_b, fill=PAPER_INK)
    d.rectangle([pad + 80, y - 2, pad + 360, y + 22], fill=REDACT)
    y += 30
    d.text((pad, y), "TO:", font=f_body_b, fill=PAPER_INK)
    d.rectangle([pad + 80, y - 2, pad + 420, y + 22], fill=REDACT)
    y += 30
    d.text((pad, y), "RE:", font=f_body_b, fill=PAPER_INK)
    d.text((pad + 80, y), "Account #", font=f_body_r, fill=PAPER_INK)
    d.rectangle([pad + 200, y - 2, pad + 340, y + 22], fill=REDACT)
    y += 36

    # Body lines
    for bold, text in body_lines:
        font = f_body_b if bold else f_body_r
        # Auto-wrap simple
        words = text.split()
        line = ""
        max_w = width - pad * 2
        for w in words:
            trial = (line + " " + w).strip()
            bbox = d.textbbox((0, 0), trial, font=font)
            if bbox[2] - bbox[0] > max_w:
                d.text((pad, y), line, font=font, fill=PAPER_INK)
                y += 24
                line = w
            else:
                line = trial
        if line:
            d.text((pad, y), line, font=font, fill=PAPER_INK)
            y += 24
        y += 6
        if y > height - 140:
            break

    # Signature block
    sig_y = height - 92
    d.line([(pad, sig_y), (pad + 280, sig_y)], fill=PAPER_INK, width=1)
    d.text((pad, sig_y + 10), "signed", font=f_body_r, fill=PAPER_DIM)
    # Redacted signature scribble
    d.rectangle([pad + 6, sig_y - 22, pad + 240, sig_y - 4], fill=REDACT)

    # Footer
    f_footer = find_font(mono_r, 14)
    d.text((pad, height - 36), "Forged by Sentry Forge · sentry-forge-landing.vercel.app",
           font=f_footer, fill=PAPER_DIM)

    # Optional diagonal stamp
    if stamp:
        f_stamp = find_font(sans_b, 64)
        stamp_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        sd = ImageDraw.Draw(stamp_layer)
        # Stamp box centered slightly right
        bbox = sd.textbbox((0, 0), stamp, font=f_stamp)
        sw = bbox[2] - bbox[0]
        sh = bbox[3] - bbox[1]
        cx = width // 2 + 80
        cy = height // 2 + 40
        # Box outline
        margin = 24
        sd.rectangle(
            [cx - sw // 2 - margin, cy - sh // 2 - margin,
             cx + sw // 2 + margin, cy + sh // 2 + margin],
            outline=ALARM, width=6
        )
        sd.text((cx - sw // 2, cy - sh // 2 - 10), stamp,
                font=f_stamp, fill=ALARM)
        # Rotate stamp -18 degrees, paste back
        stamp_rotated = stamp_layer.rotate(-18, resample=Image.BICUBIC)
        sheet = Image.alpha_composite(sheet, stamp_rotated)

    return sheet


def add_shadow(img, offset=(18, 22), blur=24, opacity=140):
    """Drop shadow behind a sheet."""
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rectangle([0, 0, img.size[0], img.size[1]], fill=(0, 0, 0, opacity))
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    return shadow


# ─── BUILD COMPOSITE ─────────────────────────────────────────────────
canvas = Image.new("RGBA", (W, H), (*BG, 255))
cd = ImageDraw.Draw(canvas)

# Subtle scanline texture
for y in range(0, H, 4):
    cd.line([(0, y), (W, y)], fill=(16, 18, 22))

# Ember glow center-back
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
for r, alpha in [(420, 18), (320, 28), (220, 40), (140, 60)]:
    cx, cy = W // 2, H // 2 + 40
    gd.ellipse([cx - r, cy - r, cx + r, cy + r],
               fill=(*EMBER, alpha))
glow = glow.filter(ImageFilter.GaussianBlur(40))
canvas = Image.alpha_composite(canvas, glow)

# Document sheets
DOC_W, DOC_H = 720, 920


# DOC 1: CFPB Complaint (back-most, leftmost)
doc1 = make_document(
    DOC_W, DOC_H,
    "CFPB Complaint",
    "Consumer Financial Protection Bureau · 12 USC § 5481",
    [
        (True, "NATURE OF COMPLAINT"),
        (False, "Debt collector continued collection activity after written validation request "
                "without providing FDCPA-compliant validation. Account is alleged to derive "
                "from a residential lease that ended via lockout without court-ordered eviction."),
        (True, "VIOLATIONS ALLEGED"),
        (False, "1. FDCPA § 1692g(b) — failure to cease collection during validation period."),
        (False, "2. FDCPA § 1692e(2)(A) — false representation of debt amount."),
        (False, "3. FCRA § 1681s-2(a) — furnishing inaccurate tradeline data to credit bureaus."),
        (True, "REQUESTED RESOLUTION"),
        (False, "Cease all collection. Delete tradeline from all three bureaus. Written "
                "confirmation of zero-balance and account closure."),
    ],
)
doc1 = doc1.rotate(-9, resample=Image.BICUBIC, expand=True)


# DOC 2: Bureau Dispute (middle)
doc2 = make_document(
    DOC_W, DOC_H,
    "Bureau Dispute",
    "FCRA § 1681i · 30-day reinvestigation demand",
    [
        (True, "DISPUTED ITEM"),
        (False, "Collection tradeline reporting under collector's name, original creditor "
                "listed as a residential lease holder. Disputed in full."),
        (True, "GROUNDS FOR DISPUTE"),
        (False, "(a) Account is not mine in the form reported — lockout terminated possession "
                "without judicial process; alleged charges accrued after I no longer had "
                "lawful access to the unit."),
        (False, "(b) Itemization received from collector includes duplicate fees and "
                "post-termination charges which inflate the principal by approximately 47%."),
        (False, "(c) Statute of limitations on the underlying contract has expired in this "
                "jurisdiction; tradeline is unenforceable."),
        (True, "REQUESTED ACTION"),
        (False, "Delete tradeline. Provide method-of-verification (MOV) under § 1681i(a)(7) "
                "if the bureau elects to retain it."),
    ],
)
doc2 = doc2.rotate(2, resample=Image.BICUBIC, expand=True)


# DOC 3: Validation Demand (top, foreground, gets the FORGED stamp)
doc3 = make_document(
    DOC_W, DOC_H,
    "Validation Demand",
    "FDCPA 15 USC § 1692g(b) · sent certified, return receipt",
    [
        (True, "FORMAL DISPUTE & VALIDATION REQUEST"),
        (False, "This letter is timely written notice that I dispute the above-referenced "
                "debt in full. Pursuant to 15 USC § 1692g(b), you must cease all collection "
                "activity until you have obtained verification of the debt and mailed it to me."),
        (True, "REQUIRED VERIFICATION"),
        (False, "1. The original signed contract giving rise to the alleged debt."),
        (False, "2. A complete itemization showing each charge, date, and basis in the contract."),
        (False, "3. Documentation of any judgment, court order, or possession order relating "
                "to the underlying tenancy."),
        (False, "4. Proof of your lawful authority to collect this debt."),
        (True, "RESERVATION OF RIGHTS"),
        (False, "Continued collection without compliant validation is a per-violation FDCPA "
                "claim under § 1692k. I am tracking this letter and your response."),
    ],
    stamp="FORGED",
)
doc3 = doc3.rotate(8, resample=Image.BICUBIC, expand=True)


# Place documents with shadows
def place(canvas, doc, x, y):
    shadow = add_shadow(doc, offset=(20, 26), blur=32, opacity=180)
    canvas.alpha_composite(shadow, (x + 14, y + 18))
    canvas.alpha_composite(doc, (x, y))
    return canvas


# Stack: doc1 back-left, doc2 middle, doc3 front-right
canvas = place(canvas, doc1, 60, 60)
canvas = place(canvas, doc2, 380, 30)
canvas = place(canvas, doc3, 720, 80)

# Bottom-left brand mark
fb_brand = find_font(mono_b, 22)
fb_label = find_font(mono_b, 14)
cd2 = ImageDraw.Draw(canvas)
mx, my = 56, H - 62
shield = [(mx + 12, my), (mx + 24, my + 8), (mx + 20, my + 24),
          (mx + 4, my + 24), (mx, my + 8)]
cd2.polygon(shield, fill=EMBER)
cd2.text((mx + 36, my + 1), "SENTRY", font=fb_brand, fill=TXT)
cd2.text((mx + 36 + 95, my + 1), "//", font=fb_brand, fill=EMBER)
cd2.text((mx + 36 + 95 + 26, my + 1), "FORGE", font=fb_brand, fill=TXT)

# Tagline right
fb_tag = find_font(mono_b, 18)
cd2.text((W - 540, H - 56), "an actual sample case · names redacted",
         font=fb_tag, fill=GILT)


# Save final
out = canvas.convert("RGB")
out.save("/home/sprit/sentry-forge-landing/proof.png", "PNG", optimize=True)
print("saved proof.png")
