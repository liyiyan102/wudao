#!/usr/bin/env python3
"""按微信分享卡比例生成首页分享图，不叠加额外文案。"""
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "images" / "covers" / "home-share-source.jpg"
OUTPUT = ROOT / "images" / "covers" / "home-share.jpg"


def main():
    image = Image.open(SOURCE).convert("RGB")
    image = ImageOps.fit(
        image,
        (1000, 800),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )
    image.save(OUTPUT, quality=95, optimize=True)
    print(f"Generated {OUTPUT}")


if __name__ == "__main__":
    main()
