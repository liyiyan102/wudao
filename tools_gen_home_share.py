#!/usr/bin/env python3
"""
Generate the 5:4 homepage share card used by WeChat.

The design intentionally stays sparse: one strong dance visual, clear brand, and
one product promise. This keeps the thumbnail readable inside WeChat's share UI.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "images" / "covers" / "contest.jpg"
OUT = ROOT / "images" / "covers" / "home-share.jpg"
W, H = 1000, 800


def font(size, bold=True):
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ]
    for path in candidates:
        p = Path(path)
        if not p.exists():
            continue
        try:
            return ImageFont.truetype(str(p), size, index=1 if bold and "PingFang" in path else 0)
        except OSError:
            continue
    return ImageFont.load_default()


def en_font(size):
    candidates = [
        "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf",
        "/System/Library/Fonts/Supplemental/Futura.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ]
    for path in candidates:
        p = Path(path)
        if not p.exists():
            continue
        try:
            return ImageFont.truetype(str(p), size)
        except OSError:
            continue
    return font(size)


def vertical_gradient(size, top, bottom):
    w, h = size
    img = Image.new("RGBA", size)
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        color = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(4))
        draw.line((0, y, w, y), fill=color)
    return img


def glow(size, center, radius, color, peak_alpha):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = center
    for r in range(radius, 0, -6):
        t = 1 - r / radius
        alpha = int(peak_alpha * t * t)
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*color, alpha))
    return layer.filter(ImageFilter.GaussianBlur(6))


def add_spaced_text(draw, xy, text, font_obj, fill, spacing):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font_obj, fill=fill)
        box = draw.textbbox((x, y), ch, font=font_obj)
        x += box[2] - box[0] + spacing


def main():
    src = Image.open(SOURCE).convert("RGB")

    # Soft full-bleed stage image: visually rich, but calm enough for large text.
    base = ImageOps.fit(src, (W, H), method=Image.Resampling.LANCZOS, centering=(0.55, 0.55))
    base = ImageEnhance.Color(base).enhance(1.08)
    base = ImageEnhance.Contrast(base).enhance(1.14)
    base = base.convert("RGBA")

    bg = Image.new("RGBA", (W, H), (10, 8, 22, 255))
    bg = Image.alpha_composite(bg, base)

    # Calm premium treatment: dark vignette, purple stage light, and left-side readability.
    bg = Image.alpha_composite(bg, glow((W, H), (690, 385), 420, (121, 76, 255), 120))
    bg = Image.alpha_composite(bg, glow((W, H), (835, 565), 260, (0, 220, 255), 70))
    bg = Image.alpha_composite(bg, vertical_gradient((W, H), (4, 4, 12, 20), (4, 4, 12, 125)))

    shade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shade_draw = ImageDraw.Draw(shade)
    for x in range(W):
        if x < 530:
            alpha = 175
        elif x < 780:
            alpha = int(175 * (1 - (x - 530) / 250))
        else:
            alpha = 0
        shade_draw.line((x, 0, x, H), fill=(5, 5, 14, alpha))
    bg = Image.alpha_composite(bg, shade)

    # Minimal tech texture, kept subtle to avoid another busy poster look.
    texture = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    tex_draw = ImageDraw.Draw(texture)
    for x in range(70, 500, 64):
        tex_draw.line((x, 92, x, 700), fill=(255, 255, 255, 10))
    for y in range(100, 700, 64):
        tex_draw.line((60, y, 515, y), fill=(255, 255, 255, 9))
    tex_draw.line((60, 630, 940, 630), fill=(167, 139, 250, 95), width=2)
    tex_draw.text((614, 72), "STREET DANCE", font=en_font(68), fill=(255, 255, 255, 18))
    tex_draw.text((614, 132), "CITY GUIDE", font=en_font(68), fill=(255, 255, 255, 12))
    bg = Image.alpha_composite(bg, texture)

    ui = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(ui)

    # Brand block.
    draw.rounded_rectangle((62, 76, 300, 122), radius=23, fill=(255, 255, 255, 24), outline=(255, 255, 255, 82))
    draw.text((86, 88), "WUDAO", font=en_font(26), fill=(225, 221, 255, 235))

    draw.text((60, 166), "舞岛", font=font(126, True), fill=(5, 5, 14, 210))
    draw.text((56, 162), "舞岛", font=font(126, True), fill=(255, 255, 255, 255))
    add_spaced_text(draw, (64, 300), "W U D A O", en_font(34), (0, 229, 255, 245), 7)

    # One-line positioning, no promotional clutter.
    draw.text((62, 382), "街舞人的内容与活动入口", font=font(42, True), fill=(255, 255, 255, 245))
    draw.text((64, 446), "看深度内容  找同城活动  约练舞搭子", font=font(27, True), fill=(255, 214, 94, 245))

    # Three quiet pills for discoverability.
    pills = ["PGC 资讯", "赛事大师课", "练舞搭子"]
    x = 62
    for pill in pills:
        box = draw.textbbox((0, 0), pill, font=font(22, True))
        w = box[2] - box[0] + 36
        draw.rounded_rectangle((x, 520, x + w, 568), radius=24, fill=(12, 10, 28, 185), outline=(255, 255, 255, 68))
        draw.text((x + 18, 533), pill, font=font(22, True), fill=(236, 234, 255, 235))
        x += w + 14

    draw.text((64, 696), "POPPING / LOCKING / BREAKING / HIPHOP", font=en_font(20), fill=(190, 181, 230, 160))
    draw.rounded_rectangle((0, 0, W - 1, H - 1), radius=0, outline=(255, 255, 255, 28), width=2)

    out = Image.alpha_composite(bg, ui).convert("RGB")
    out.save(OUT, quality=94, optimize=True)
    print(f"Generated {OUT}")


if __name__ == "__main__":
    main()
