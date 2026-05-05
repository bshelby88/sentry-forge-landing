#!/usr/bin/env python3
"""Sentry Forge favicons — forge-shield mark with ember fill, steel base."""
from PIL import Image, ImageDraw, ImageFont
import glob

SIZES = [16, 32, 48, 180]

BG     = (12, 14, 18)        # steel-950
EMBER  = (250, 145, 80)
ALARM  = (235, 95, 80)
TXT    = (240, 242, 246)


def find_font(size):
    for p in glob.glob("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()


def shield_polygon(size: int):
    """Forge shield clip-path scaled to size×size."""
    s = size
    return [
        (s * 0.50, s * 0.05),  # top point
        (s * 0.95, s * 0.32),  # upper right
        (s * 0.85, s * 0.95),  # lower right
        (s * 0.15, s * 0.95),  # lower left
        (s * 0.05, s * 0.32),  # upper left
    ]


def render(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # forge shield background (gradient faked: ember outer → alarm inner via two polygons)
    d.polygon(shield_polygon(size), fill=EMBER)
    inset = max(1, size // 14)
    inner = [(x - inset if x > size / 2 else x + inset,
              y + inset if y < size / 2 else y - inset)
             for x, y in shield_polygon(size)]
    # darker forge core
    d.polygon(inner, fill=(195, 90, 50))

    # F monogram (visible on 32+) — capital F using Bold sans
    if size >= 24:
        fsize = int(size * 0.55)
        f = find_font(fsize)
        text = "F"
        bb = d.textbbox((0, 0), text, font=f)
        tw = bb[2] - bb[0]
        th = bb[3] - bb[1]
        tx = (size - tw) // 2 - bb[0]
        ty = (size - th) // 2 - bb[1] + size // 18
        d.text((tx, ty), text, font=f, fill=BG)

    # tiny spark dot top-right (forge ember spark)
    if size >= 32:
        r = max(1, size // 14)
        d.ellipse([size - r * 2 - r, r,
                   size - r, r + r * 2], fill=ALARM)

    return img


imgs = [render(s) for s in SIZES]

# multi-size .ico
imgs[0].save(
    "/home/sprit/sentry-forge-landing/favicon.ico",
    format="ICO",
    sizes=[(s, s) for s in SIZES[:3]],
)
imgs[3].save("/home/sprit/sentry-forge-landing/apple-touch-icon.png",
             "PNG", optimize=True)
imgs[1].save("/home/sprit/sentry-forge-landing/favicon-32.png",
             "PNG", optimize=True)
print("saved favicon.ico + apple-touch-icon.png + favicon-32.png")
