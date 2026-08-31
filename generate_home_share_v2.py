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
        "/System/Library/Fonts/Supplemental/Impact.ttf",
        "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf",
        "/System/Library/Fonts/Supplemental/Futura.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ]
    for p in cands:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size, index=0)
            except Exception:
                continue
    return get_font(size, bold)

# 1. 创建高质感深色背景
# 采用深邃夜场潮流底色 (#0A0815 -> #1A1230 -> #120E22)
bg = Image.new("RGBA", (W, H), (10, 8, 21, 255))
draw = ImageDraw.Draw(bg)

# 纵向多段渐变
for y in range(H):
    t = y / H
    r = int(10 + 20 * math.sin(t * math.pi * 0.8))
    g = int(8 + 12 * math.sin(t * math.pi * 0.8))
    b = int(21 + 35 * math.sin(t * math.pi * 0.8))
    draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

# 2. 丰富的光效层
glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow_layer)

# 舞者背后的超级能量光球 (电光紫 + 荧光蓝)
cx, cy = 690, 410
for radius in range(450, 0, -6):
    pct = radius / 450
    alpha = int(55 * (1 - pct ** 1.3))
    # 从外围暗紫到中心高亮蓝紫
    pr = int(120 - 50 * (1 - pct))
    pg = int(30 + 110 * (1 - pct))
    pb = int(255)
    glow_draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=(pr, pg, pb, alpha))

# 左下角与左上角补光
for radius in range(300, 0, -10):
    pct = radius / 300
    alpha = int(28 * (1 - pct))
    glow_draw.ellipse([120 - radius, 100 - radius, 120 + radius, 100 + radius], fill=(0, 229, 255, alpha))
    glow_draw.ellipse([180 - radius, 650 - radius, 180 + radius, 650 + radius], fill=(123, 97, 255, alpha))

bg = Image.alpha_composite(bg, glow_layer)

# 3. 街头潮流装饰线条与大水印
deco_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
deco_draw = ImageDraw.Draw(deco_layer)

# 巨大半透明街舞英文水印 (WUDAO ARCHIVE)
font_watermark = get_en_font(130, bold=True)
deco_draw.text((40, 30), "STREET DANCE", font=font_watermark, fill=(255, 255, 255, 12))
deco_draw.text((40, 160), "CULTURE HUB", font=font_watermark, fill=(255, 255, 255, 8))

# 精致网格与准星
for x in range(50, 520, 45):
    deco_draw.line([(x, 60), (x, 740)], fill=(255, 255, 255, 10), width=1)
for y in range(70, 740, 45):
    deco_draw.line([(50, y), (500, y)], fill=(255, 255, 255, 10), width=1)

# 潮流准星
for px, py in [(50, 70), (455, 70), (50, 700), (455, 700), (230, 385)]:
    deco_draw.line([(px - 8, py), (px + 8, py)], fill=(0, 240, 255, 120), width=1)
    deco_draw.line([(px, py - 8), (px, py + 8)], fill=(0, 240, 255, 120), width=1)

# 舞台反光地面
ground_y = 650
for y in range(ground_y, H):
    pct = (y - ground_y) / (H - ground_y)
    alpha = int(120 * pct)
    deco_draw.line([(0, y), (W, y)], fill=(32, 20, 60, alpha))
deco_draw.line([(0, ground_y), (W, ground_y)], fill=(138, 92, 246, 160), width=2)
deco_draw.line([(0, ground_y + 1), (W, ground_y + 1)], fill=(0, 229, 255, 100), width=1)

bg = Image.alpha_composite(bg, deco_layer)

# 4. 舞者处理与合成
raw_share = Image.open('images/covers/home-share.jpg').convert('RGBA')
# 截取舞者高画质区域 (x: 410~990, y: 100~780)
raw_dancer = raw_share.crop((410, 100, 990, 780))

# 放大舞者，占据右侧 660x780 空间
target_w = 660
target_h = int(raw_dancer.height * (target_w / raw_dancer.width))
dancer_scaled = raw_dancer.resize((target_w, target_h), Image.Resampling.LANCZOS)

# 提升对比度与色彩饱和度
enh_c = ImageEnhance.Contrast(dancer_scaled)
dancer_scaled = enh_c.enhance(1.15)
enh_col = ImageEnhance.Color(dancer_scaled)
dancer_scaled = enh_col.enhance(1.2)

# 制作带平滑边缘的遮罩
d_gray = dancer_scaled.convert('L')
# 阈值拉伸：低亮度渐变透明，高亮度完全保留
mask = d_gray.point(lambda p: min(255, int((p ** 1.15) * 1.8)))

# 贴上舞者 (右下对齐)
dx = W - target_w + 30
dy = 40
bg.paste(dancer_scaled, (dx, dy), mask)

# 在舞者手上增加闪烁星芒 (Lens Flare)
flare_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
flare_draw = ImageDraw.Draw(flare_layer)
# 撑地点大约在 dx + 130, dy + 610
fx, fy = dx + 135, dy + 615
for radius in range(70, 0, -3):
    alpha = int(180 * (1 - (radius / 70) ** 0.8))
    flare_draw.ellipse([fx - radius, fy - radius, fx + radius, fy + radius], fill=(255, 255, 255, alpha))
# 十字芒线
flare_draw.line([(fx - 60, fy), (fx + 60, fy)], fill=(255, 255, 255, 220), width=2)
flare_draw.line([(fx, fy - 60), (fx, fy + 60)], fill=(255, 255, 255, 220), width=2)
flare_draw.line([(fx - 35, fy - 35), (fx + 35, fy + 35)], fill=(0, 229, 255, 160), width=1)
flare_draw.line([(fx - 35, fy + 35), (fx + 35, fy - 35)], fill=(0, 229, 255, 160), width=1)

bg = Image.alpha_composite(bg, flare_layer)

# 5. UI 与文案层
ui_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ui_draw = ImageDraw.Draw(ui_layer)

# (A) 顶部 Badge 胶囊
bx, by = 60, 68
bw, bh = 380, 44
# 胶囊底
ui_draw.rounded_rectangle(
    [bx, by, bx + bw, by + bh],
    radius=22,
    fill=(123, 97, 255, 55),
    outline=(168, 85, 247, 200),
    width=1
)
font_badge = get_font(20, bold=True)
ui_draw.text((bx + 20, by + 11), "⚡ 街舞人的专业资讯 · 官方活动", font=font_badge, fill=(240, 235, 255, 255))

# (B) 超级大字标: 舞 岛
font_title = get_font(96, bold=True)
font_en = get_en_font(42, bold=True)

# 标题双层阴影立体感
ui_draw.text((64, 142), "舞 岛", font=font_title, fill=(5, 3, 15, 220))
ui_draw.text((62, 140), "舞 岛", font=font_title, fill=(123, 97, 255, 160))
ui_draw.text((60, 138), "舞 岛", font=font_title, fill=(255, 255, 255, 255))

# 英文 WUDAO 潮流字标
en_text = "W U D A O"
ui_draw.text((62, 254), en_text, font=font_en, fill=(0, 240, 255, 255))

# 装饰电光横线
ui_draw.line([(280, 275), (460, 275)], fill=(138, 92, 246, 180), width=2)
ui_draw.line([(460, 275), (485, 275)], fill=(0, 240, 255, 255), width=3)

# (C) Slogan 核心主张
font_slogan = get_font(32, bold=True)
# 渐色高亮
ui_draw.text((60, 318), "看懂行的内容", font=font_slogan, fill=(255, 255, 255, 255))
ui_draw.text((255, 318), " · ", font=font_slogan, fill=(160, 150, 190, 220))
ui_draw.text((290, 318), "找同城活动与搭子", font=font_slogan, fill=(255, 214, 0, 255))

# (D) 三大亮点毛玻璃胶囊卡片
chips = [
    ("🏆 官方赛事 / 顶级大师课预告", (255, 107, 53), "HOT"),
    ("⚡ 练舞搭子 / 拼课找队友 / 地图", (138, 92, 246), "NEW"),
    ("📖 独家文化 / 舞者康复 / 舞室测评", (16, 185, 129), "PRO")
]

cy = 385
for text, col, tag in chips:
    cw, ch = 420, 58
    # 半透明黑金/深紫底卡片
    ui_draw.rounded_rectangle(
        [60, cy, 60 + cw, cy + ch],
        radius=14,
        fill=(22, 17, 40, 215),
        outline=(col[0], col[1], col[2], 140),
        width=1
    )
    # 左侧亮点立柱
    ui_draw.rounded_rectangle(
        [65, cy + 9, 70, cy + ch - 9],
        radius=2,
        fill=(col[0], col[1], col[2], 255)
    )
    # 文字
    font_chip = get_font(21, bold=True)
    ui_draw.text((82, cy + 16), text, font=font_chip, fill=(245, 245, 255, 255))
    
    # 右侧微型发光小 Tag (HOT / NEW / PRO)
    tag_w = 44
    tag_x = 60 + cw - tag_w - 12
    tag_y = cy + 16
    ui_draw.rounded_rectangle(
        [tag_x, tag_y, tag_x + tag_w, tag_y + 24],
        radius=6,
        fill=(col[0], col[1], col[2], 40),
        outline=(col[0], col[1], col[2], 160),
        width=1
    )
    font_tag = get_en_font(13, bold=True)
    ui_draw.text((tag_x + 8, tag_y + 4), tag, font=font_tag, fill=(col[0], col[1], col[2], 255))
    
    cy += 74

# (E) 底部 CTA 渐变发光按钮
cta_x, cta_y = 60, 626
cta_w, cta_h = 240, 52
# 按钮外发光
for r in range(12, 0, -2):
    ui_draw.rounded_rectangle(
        [cta_x - r, cta_y - r, cta_x + cta_w + r, cta_y + cta_h + r],
        radius=26 + r,
        fill=(123, 97, 255, int(15 * (1 - r / 12)))
    )
ui_draw.rounded_rectangle(
    [cta_x, cta_y, cta_x + cta_w, cta_y + cta_h],
    radius=26,
    fill=(123, 97, 255, 255),
    outline=(210, 190, 255, 255),
    width=1
)
font_cta = get_font(22, bold=True)
ui_draw.text((cta_x + 36, cta_y + 14), "即刻进入探索 ➔", font=font_cta, fill=(255, 255, 255, 255))

# 底部舞种流派微标
font_sub = get_en_font(17, bold=True)
ui_draw.text((60, 718), "POPPING · LOCKING · BREAKING · HIPHOP · WAACKING", font=font_sub, fill=(130, 120, 165, 190))

# (F) 全图 1px 微发光内边框 (在白底卡片中更加显眼精致)
ui_draw.rounded_rectangle(
    [0, 0, W - 1, H - 1],
    radius=0,
    outline=(123, 97, 255, 100),
    width=2
)

final_img = Image.alpha_composite(bg, ui_layer).convert('RGB')
final_img.save('/tmp/home_share_v2.jpg', quality=95)
print("Generated /tmp/home_share_v2.jpg")
