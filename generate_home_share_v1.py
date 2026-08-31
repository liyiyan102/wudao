#!/usr/bin/env python3
import os
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance, ImageOps

W, H = 1000, 800

def get_font(size, bold=True):
    cands = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ]
    for p in cands:
        if Path(p).exists():
            try:
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
        "/System/Library/Fonts/Supplemental/Impact.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ]
    for p in cands:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size, index=0)
            except Exception:
                continue
    return get_font(size, bold)

# 1. 创建基础背景渐变 (深邃夜场紫蓝 -> 电光紫)
bg = Image.new("RGBA", (W, H), (14, 11, 26, 255))
draw = ImageDraw.Draw(bg)

# 绘制多层丰富背景光效
for y in range(H):
    # 纵向深色渐变
    r = int(14 + (y / H) * 12)
    g = int(11 + (y / H) * 8)
    b = int(26 + (y / H) * 20)
    draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

# 在右侧增加一个巨大的发光球体 (Radial Glow) 给舞者打光
glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow_layer)

cx, cy = 680, 420
for radius in range(380, 0, -8):
    alpha = int(45 * (1 - (radius / 380) ** 1.5))
    # 从外紫到内青紫
    pr = int(110 - 40 * (1 - radius / 380))
    pg = int(40 + 80 * (1 - radius / 380))
    pb = int(240 + 15 * (1 - radius / 380))
    glow_draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=(pr, pg, pb, alpha))

# 在左上方加一个微弱的冷青色光晕
for radius in range(250, 0, -10):
    alpha = int(25 * (1 - radius / 250))
    glow_draw.ellipse([150 - radius, 120 - radius, 150 + radius, 120 + radius], fill=(0, 220, 255, alpha))

bg = Image.alpha_composite(bg, glow_layer)

# 2. 绘制街头网格 & 潮流辅助线
grid_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
grid_draw = ImageDraw.Draw(grid_layer)

# 左半侧网格
for x in range(40, 520, 40):
    grid_draw.line([(x, 60), (x, 740)], fill=(255, 255, 255, 12), width=1)
for y in range(80, 740, 40):
    grid_draw.line([(40, y), (500, y)], fill=(255, 255, 255, 12), width=1)

# 十字光标
for px, py in [(60, 100), (460, 100), (60, 700), (460, 700), (260, 400)]:
    grid_draw.line([(px - 6, py), (px + 6, py)], fill=(0, 229, 255, 90), width=1)
    grid_draw.line([(px, py - 6), (px, py + 6)], fill=(0, 229, 255, 90), width=1)

# 底部反光舞台地面
ground_y = 660
for y in range(ground_y, H):
    alpha = int(90 * ((y - ground_y) / (H - ground_y)))
    grid_draw.line([(0, y), (W, y)], fill=(40, 25, 75, alpha))
grid_draw.line([(0, ground_y), (W, ground_y)], fill=(123, 97, 255, 120), width=2)

bg = Image.alpha_composite(bg, grid_layer)

# 3. 提取并放大原舞者主体
raw_share = Image.open('images/covers/home-share.jpg').convert('RGBA')
# 截取舞者高质区域 (x: 420~980, y: 120~760)
raw_dancer = raw_share.crop((420, 110, 990, 780))
# 放大舞者，让它充满画面右侧 (宽约 620, 高约 730)
target_w = 640
target_h = int(raw_dancer.height * (target_w / raw_dancer.width))
dancer_scaled = raw_dancer.resize((target_w, target_h), Image.Resampling.LANCZOS)

# 舞者位置：贴紧右侧和地面
dx = W - target_w + 20
dy = 50

# 将舞者贴到背景上（使用 Screen / Overlay 融合或者直接混合）
# 制作舞者的遮罩，把黑色背景滤掉保留亮光和轮廓
d_gray = dancer_scaled.convert('L')
# 增强对比度作为透明度遮罩
mask = d_gray.point(lambda p: min(255, int(p * 1.6)))
# 贴上舞者
bg.paste(dancer_scaled, (dx, dy), mask)

# 4. 在左侧绘制品牌与文案
ui_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ui_draw = ImageDraw.Draw(ui_layer)

# (A) 顶部 Badge: ⚡ 街舞人的专业资讯与活动平台
badge_x, badge_y = 60, 75
badge_w, badge_h = 360, 42
# 绘制半透明胶囊背景
ui_draw.rounded_rectangle(
    [badge_x, badge_y, badge_x + badge_w, badge_y + badge_h],
    radius=21,
    fill=(123, 97, 255, 45),
    outline=(160, 130, 255, 160),
    width=1
)
font_badge = get_font(20, bold=True)
ui_draw.text((badge_x + 18, badge_y + 10), "⚡ 街舞人的内容资讯 · 活动平台", font=font_badge, fill=(235, 230, 255, 255))

# (B) 主标题: 舞 岛 (超大潮流粗字标)
font_title = get_font(88, bold=True)
font_en = get_en_font(38, bold=True)

# 投影效果
ui_draw.text((64, 154), "舞 岛", font=font_title, fill=(20, 10, 45, 200))
ui_draw.text((60, 150), "舞 岛", font=font_title, fill=(255, 255, 255, 255))

# 英文 WUDAO 带字间距
en_text = "W U D A O"
ui_draw.text((62, 260), en_text, font=font_en, fill=(0, 229, 255, 240))

# 装饰线条
ui_draw.line([(260, 278), (460, 278)], fill=(123, 97, 255, 150), width=2)
ui_draw.line([(460, 278), (480, 278)], fill=(0, 229, 255, 220), width=2)

# (C) 价值主张 Slogan
font_slogan = get_font(30, bold=True)
ui_draw.text((60, 325), "看懂行的内容 · 找同城活动与搭子", font=font_slogan, fill=(255, 215, 64, 255))

# (D) 三大亮点胶囊卡片 (Pill Cards)
chips = [
    ("🏆 官方赛事 / 顶级大师课 / 预告", (255, 107, 53)),
    ("⚡ 练舞搭子 / 拼课找队友 / 地图找局", (123, 97, 255)),
    ("📖 深度文化 / 舞者康复 / 舞室测评", (0, 200, 115))
]

chip_y = 390
for text, accent_color in chips:
    cw, ch = 410, 56
    # 背景
    ui_draw.rounded_rectangle(
        [60, chip_y, 60 + cw, chip_y + ch],
        radius=14,
        fill=(25, 20, 45, 190),
        outline=(accent_color[0], accent_color[1], accent_color[2], 130),
        width=1
    )
    # 左侧小彩条
    ui_draw.rounded_rectangle(
        [64, chip_y + 8, 68, chip_y + ch - 8],
        radius=2,
        fill=(accent_color[0], accent_color[1], accent_color[2], 255)
    )
    # 文字
    font_chip = get_font(21, bold=True)
    ui_draw.text((80, chip_y + 16), text, font=font_chip, fill=(245, 245, 255, 245))
    chip_y += 72

# (E) 底部 CTA 胶囊
cta_x, cta_y = 60, 625
cta_w, cta_h = 240, 52
ui_draw.rounded_rectangle(
    [cta_x, cta_y, cta_x + cta_w, cta_y + cta_h],
    radius=26,
    fill=(123, 97, 255, 240),
    outline=(200, 180, 255, 255),
    width=1
)
font_cta = get_font(22, bold=True)
ui_draw.text((cta_x + 36, cta_y + 14), "即刻进入探索 ➔", font=font_cta, fill=(255, 255, 255, 255))

# 底部小文字
font_sub = get_font(16, bold=False)
ui_draw.text((60, 715), "HIPHOP · POPPING · LOCKING · BREAKING · CHOREO", font=font_sub, fill=(160, 150, 190, 180))

final_img = Image.alpha_composite(bg, ui_layer).convert('RGB')
final_img.save('/tmp/home_share_v1.jpg', quality=95)
print("Generated /tmp/home_share_v1.jpg")
