"""Split-screen cover from real IG stills. Run from this folder."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

HERE = Path(__file__).resolve().parent
OUT = HERE / "ness-greenteck-cover.png"
W, H = 1080, 1440


def load_font(size, bold=False):
    cands = [
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/System/Library/Fonts/Supplemental/Songti.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
    ]
    for p in cands:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size, index=0)
            except OSError:
                continue
    return ImageFont.load_default()


def cover_crop(im: Image.Image, box, size, centering=(0.5, 0.22)):
    im = im.convert("RGB")
    x0, y0, x1, y1 = box
    crop = im.crop((x0, y0, x1, y1))
    return ImageOps.fit(crop, size, method=Image.Resampling.LANCZOS, centering=centering)


def grade(im: Image.Image, dark=0.72):
    im = ImageEnhance.Color(im).enhance(0.85)
    im = ImageEnhance.Contrast(im).enhance(1.12)
    overlay = Image.new("RGB", im.size, (8, 8, 10))
    return Image.blend(im, overlay, 1 - dark)


def main():
    g = Image.open(HERE / "greenteck-workshop.jpg")
    n = Image.open(HERE / "ness-workshop-1.jpg")
    gw, gh = g.size
    nw, nh = n.size
    # Greenteck crouching center-front of BASE class photo
    left = cover_crop(
        g,
        (int(gw * 0.18), int(gh * 0.38), int(gw * 0.82), int(gh * 0.92)),
        (W // 2, H),
        centering=(0.5, 0.28),
    )
    # Ness is crouched at the BOTTOM of the workshop still
    right = cover_crop(
        n,
        (int(nw * 0.36), int(nh * 0.42), int(nw * 0.64), int(nh * 0.88)),
        (W // 2, H),
        centering=(0.5, 0.18),
    )
    left = grade(left, 0.78)
    right = grade(right, 0.78)

    canvas = Image.new("RGB", (W, H), (10, 10, 12))
    canvas.paste(left, (0, 0))
    canvas.paste(right, (W // 2, 0))

    # center seam
    draw = ImageDraw.Draw(canvas, "RGBA")
    draw.rectangle((W // 2 - 3, 0, W // 2 + 3, H), fill=(212, 168, 72, 220))

    # bottom gradient
    grad = Image.new("L", (1, H))
    for y in range(H):
        if y < H * 0.55:
            v = 0
        else:
            v = int(210 * (y - H * 0.55) / (H * 0.45))
        grad.putpixel((0, y), min(v, 210))
    grad = grad.resize((W, H))
    dark = Image.new("RGB", (W, H), (6, 6, 8))
    canvas = Image.composite(dark, canvas, grad)
    draw = ImageDraw.Draw(canvas)

    gold = (220, 176, 78)
    white = (248, 246, 240)
    font_vs = load_font(92)
    font_cn = load_font(78)
    font_sub = load_font(28)
    font_name = load_font(26)

    # VS badge
    cx, cy = W // 2, int(H * 0.46)
    draw.ellipse((cx - 58, cy - 58, cx + 58, cy + 58), fill=(12, 12, 14), outline=gold, width=4)
    vs = "VS"
    bbox = draw.textbbox((0, 0), vs, font=font_vs)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw / 2, cy - th / 2 - 8), vs, font=font_vs, fill=gold)

    draw.text((48, 48), "GREENTECK", font=font_name, fill=gold)
    draw.text((48, 82), "绿坦", font=font_sub, fill=white)
    rb = draw.textbbox((0, 0), "NESS", font=font_name)
    draw.text((W - 48 - (rb[2] - rb[0]), 48), "NESS", font=font_name, fill=gold)
    rb2 = draw.textbbox((0, 0), "Westgang", font=font_sub)
    draw.text((W - 48 - (rb2[2] - rb2[0]), 82), "Westgang", font=font_sub, fill=white)

    title = "圈里说的恩怨"
    tb = draw.textbbox((0, 0), title, font=font_cn)
    tw = tb[2] - tb[0]
    draw.text(((W - tw) / 2, H - 220), title, font=font_cn, fill=white)
    # gold underline
    draw.rectangle(((W - tw) / 2, H - 128, (W - tw) / 2 + tw * 0.42, H - 118), fill=gold)

    sub = "对得上的几场比赛"
    sb = draw.textbbox((0, 0), sub, font=font_sub)
    sw = sb[2] - sb[0]
    draw.text(((W - sw) / 2, H - 96), sub, font=font_sub, fill=(180, 176, 168))

    canvas = canvas.filter(ImageFilter.UnsharpMask(radius=1.2, percent=80, threshold=3))
    canvas.save(OUT, "PNG")
    print("wrote", OUT, canvas.size)


if __name__ == "__main__":
    main()
