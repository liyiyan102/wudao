#!/usr/bin/env python3
"""
生成高质量、潮流动感、饱满有层次的 5:4 微信小程序首页分享封面 (1000x800)
"""
import os
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance, ImageOps

W, H = 1000, 800

def get_font(size, bold=True):
    # 优先使用 PingFang SC / Hiragino / Arial
    cands = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ]
    for p in cands:
        if Path(p).exists():
            try:
                # index 1 or 2 for PingFang is Bold/Medium
                idx = 1 if "PingFang" in p and bold else 0
                return ImageFont.truetype(p, size, index=idx)
            except Exception:
                try:
                    return ImageFont.truetype(p, size, index=0)
                except Exception:
                    continue
    return ImageFont.load_default()

def get_en_font(size, bold=True):
    cands = [
        "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf",
        "/System/Library/Fonts/Supplemental/Futura.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/PingFang.ttc",
    ]
    for p in cands:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size, index=0)
            except Exception:
                continue
    return get_font(size, bold)

print("Font helper ready")
