"""Cover from Street Dance Roots Hall of Fame still. Run from this folder."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

HERE = Path(__file__).resolve().parent
SRC = HERE / "raw" / "sdr-tony.png"
OUT = HERE / "tony-gogo-cover.png"
W, H = 1080, 1440


def load_font(size):
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


def main():
    im = Image.open(SRC).convert("RGB")
    crop = ImageOps.fit(im, (W, H), method=Image.Resampling.LANCZOS, centering=(0.5, 0.18))
    crop = ImageEnhance.Color(crop).enhance(0.92)
    crop = ImageEnhance.Contrast(crop).enhance(1.08)
    overlay = Image.new("RGB", crop.size, (8, 8, 10))
    canvas = Image.blend(crop, overlay, 0.12)

    grad = Image.new("L", (1, H))
    for y in range(H):
        if y < H * 0.42:
            v = 0
        else:
            v = int(230 * (y - H * 0.42) / (H * 0.58))
        grad.putpixel((0, y), min(v, 230))
    canvas = Image.composite(Image.new("RGB", (W, H), (6, 6, 8)), canvas, grad.resize((W, H)))
    draw = ImageDraw.Draw(canvas)

    gold = (220, 176, 78)
    white = (248, 246, 240)
    mute = (180, 176, 168)
    font_kicker = load_font(26)
    font_name = load_font(34)
    font_cn = load_font(72)
    font_sub = load_font(28)

    draw.text((48, 48), "THE LOCKERS", font=font_kicker, fill=gold)
    draw.text((48, 86), "TONY GOGO", font=font_name, fill=white)

    title = "被捕，还没判"
    tb = draw.textbbox((0, 0), title, font=font_cn)
    tw = tb[2] - tb[0]
    tx = (W - tw) / 2
    ty = H - 236
    draw.text((tx, ty), title, font=font_cn, fill=white)
    draw.rectangle((tx, H - 148, tx + tw * 0.38, H - 138), fill=gold)

    sub = "GOGO BROTHERS 的爸爸 · 日本新闻"
    sb = draw.textbbox((0, 0), sub, font=font_sub)
    sw = sb[2] - sb[0]
    draw.text(((W - sw) / 2, H - 108), sub, font=font_sub, fill=mute)

    canvas = canvas.filter(ImageFilter.UnsharpMask(radius=1.2, percent=80, threshold=3))
    canvas.save(OUT, "PNG")
    print("wrote", OUT, canvas.size)


if __name__ == "__main__":
    main()
