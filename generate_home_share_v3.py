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

# 1. 创建高质感深邃背景
bg = Image.new("RGBA", (W, H), (12, 10, 24, 255))
draw = ImageDraw.Draw(bg)

# 纵向 + 径向深色渐变
for y in range(H):
    t = y / H
    r = int(10 + 16 * math.sin(t * math.pi * 0.7))
    g = int(8 + 10 * math.sin(t * math.pi * 0.7))
    b = int(22 + 30 * math.sin(t * math.pi * 0.7))
    draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

# 2. 丰富的光效层
glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow_layer)

# 舞者背后的超级能量光球 (电光紫 + 荧光蓝)
cx, cy = 690, 400
for radius in range(480, 0, -5):
    pct = radius / 480
    alpha = int(60 * (1 - pct ** 1.4))
    pr = int(130 - 60 * (1 - pct))
    pg = int(35 + 130 * (1 - pct))
    pb = int(255)
    glow_draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=(pr, pg, pb, alpha))

# 左侧局部氛围光 (青蓝色补光)
for radius in range(260, 0, -8):
    pct = radius / 260
    alpha = int(22 * (1 - pct))
    glow_draw.ellipse([160 - radius, 140 - radius, 160 + radius, 140 + radius], fill=(0, 229, 255, alpha))

bg = Image.alpha_composite(bg, glow_layer)

# 3. 街头潮流装饰线条与背景水印
deco_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
deco_draw = ImageDraw.Draw(deco_layer)

# 右上方斜切大水印
font_wm = get_en_font(90, bold=True)
deco_draw.text((360, 25), "STREET DANCE", font=font_wm, fill=(255, 255, 255, 10))
deco_draw.text((450, 110), "ARCHIVE // 2026", font=get_en_font(40, bold=True), fill=(0, 229, 255, 25))

# 精致网格 (左侧 480px 范围)
for x in range(45, 500, 45):
    deco_draw.line([(x, 50), (x, 740)], fill=(255, 255, 255, 8), width=1)
for y in range(60, 740, 45):
    deco_draw.line([(45, y), (480, y)], fill=(255, 255, 255, 8), width=1)

# 潮流准星与标记
for px, py in [(45, 60), (450, 60), (45, 690), (450, 690), (225, 375)]:
    deco_draw.line([(px - 7, py), (px + 7, py)], fill=(0, 240, 255, 140), width=1)
    deco_draw.line([(px, py - 7), (px, py + 7)], fill=(0, 240, 255, 140), width=1)

# 舞台地面 (带双色霓虹反光线)
ground_y = 650
for y in range(ground_y, H):
    pct = (y - ground_y) / (H - ground_y)
    alpha = int(140 * pct)
    deco_draw.line([(0, y), (W, y)], fill=(28, 18, 55, alpha))
deco_draw.line([(0, ground_y), (W, ground_y)], fill=(138, 92, 246, 180), width=2)
deco_draw.line([(0, ground_y + 1), (W, ground_y + 1)], fill=(0, 240, 255, 120), width=1)

bg = Image.alpha_composite(bg, deco_layer)

# 4. 舞者主体提取与强化
raw_share = Image.open('images/covers/home-share.jpg').convert('RGBA')
raw_dancer = raw_share.crop((410, 100, 990, 780))

# 舞者占据右侧 670x790 空间
target_w = 670
target_h = int(raw_dancer.height * (target_w / raw_dancer.width))
dancer_scaled = raw_dancer.resize((target_w, target_h), Image.Resampling.LANCZOS)

# 色彩与对比度强化
dancer_scaled = ImageEnhance.Contrast(dancer_scaled).enhance(1.22)
dancer_scaled = ImageEnhance.Color(dancer_scaled).enhance(1.25)

# 平滑边缘遮罩
d_gray = dancer_scaled.convert('L')
mask = d_gray.point(lambda p: min(255, int((p ** 1.12) * 1.9)))

# 贴上舞者
dx = W - target_w + 35
dy = 35
bg.paste(dancer_scaled, (dx, dy), mask)

# 舞者支撑点手部星芒
flare_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
flare_draw = ImageDraw.Draw(flare_layer)
fx, fy = dx + 138, dy + 620
for radius in range(75, 0, -3):
    alpha = int(190 * (1 - (radius / 75) ** 0.8))
    flare_draw.ellipse([fx - radius, fy - radius, fx + radius, fy + radius], fill=(255, 255, 255, alpha))

flare_draw.line([(fx - 70, fy), (fx + 70, fy)], fill=(255, 255, 255, 240), width=2)
flare_draw.line([(fx, fy - 70), (fx, fy + 70)], fill=(255, 255, 255, 240), width=2)
flare_draw.line([(fx - 40, fy - 40), (fx + 40, fy + 40)], fill=(0, 240, 255, 180), width=1)
flare_draw.line([(fx - 40, fy + 40), (fx + 40, fy - 40)], fill=(0, 240, 255, 180), width=1)

bg = Image.alpha_composite(bg, flare_layer)

# 5. UI 与排版设计
ui_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ui_draw = ImageDraw.Draw(ui_layer)

# (A) 顶部 Badge 胶囊
bx, by = 55, 65
bw, bh = 375, 42
ui_draw.rounded_rectangle(
    [bx, by, bx + bw, by + bh],
    radius=21,
    fill=(123, 97, 255, 60),
    outline=(168, 85, 247, 220),
    width=1
)
font_badge = get_font(19, bold=True)
ui_draw.text((bx + 18, by + 11), "⚡ 街舞人的内容资讯 · 官方活动平台", font=font_badge, fill=(245, 240, 255, 255))

# (B) 超级大字标: 舞 岛
font_title = get_font(98, bold=True)
font_en = get_en_font(38, bold=True)

# 立体投影
ui_draw.text((58, 137), "舞岛", font=font_title, fill=(5, 3, 15, 230))
ui_draw.text((56, 135), "舞岛", font=font_title, fill=(123, 97, 255, 170))
ui_draw.text((54, 133), "舞岛", font=font_title, fill=(255, 255, 255, 255))

# 英文 WUDAO 潮流字标 + 活力橙撞色
ui_draw.text((56, 248), "W U D A O", font=font_en, fill=(0, 240, 255, 255))
ui_draw.text((250, 254), "STREET DANCE HUB", font=get_en_font(20, bold=True), fill=(255, 180, 0, 220))

# 装饰分割线
ui_draw.line([(56, 296), (460, 296)], fill=(138, 92, 246, 160), width=2)
ui_draw.line([(420, 296), (460, 296)], fill=(0, 240, 255, 255), width=3)

# (C) Slogan 主张
font_slogan = get_font(31, bold=True)
ui_draw.text((55, 318), "看懂行的内容", font=font_slogan, fill=(255, 255, 255, 255))
ui_draw.text((245, 318), " · ", font=font_slogan, fill=(160, 150, 190, 220))
ui_draw.text((275, 318), "找同城活动与搭子", font=font_slogan, fill=(255, 220, 40, 255))

# (D) 三大亮点毛玻璃胶囊卡片
chips = [
    ("🏆 官方赛事 / 顶级大师课预告", (255, 107, 53), "HOT"),
    ("⚡ 练舞搭子 / 拼课找队友 / 地图", (138, 92, 246), "NEW"),
    ("📖 独家文化 / 舞者康复 / 舞室测评", (16, 185, 129), "PRO")
]

cy = 385
for text, col, tag in chips:
    cw, ch = 420, 56
    # 拟物毛玻璃底
    ui_draw.rounded_rectangle(
        [55, cy, 55 + cw, cy + ch],
        radius=14,
        fill=(22, 17, 38, 225),
        outline=(col[0], col[1], col[2], 150),
        width=1
    )
    # 左侧亮点立柱
    ui_draw.rounded_rectangle(
        [60, cy + 8, 65, cy + ch - 8],
        radius=2,
        fill=(col[0], col[1], col[2], 255)
    )
    # 文字
    font_chip = get_font(21, bold=True)
    ui_draw.text((78, cy + 15), text, font=font_chip, fill=(245, 245, 255, 255))
    
    # 右侧微型发光小 Tag (HOT / NEW / PRO)
    tag_w = 44
    tag_x = 55 + cw - tag_w - 12
    tag_y = cy + 15
    ui_draw.rounded_rectangle(
        [tag_x, tag_y, tag_x + tag_w, tag_y + 24],
        radius=6,
        fill=(col[0], col[1], col[2], 45),
        outline=(col[0], col[1], col[2], 180),
        width=1
    )
    font_tag = get_en_font(13, bold=True)
    ui_draw.text((tag_x + 8, tag_y + 4), tag, font=font_tag, fill=(col[0], col[1], col[2], 255))
    
    cy += 72

# (E) 底部 CTA 发光胶囊按钮 (渐变紫橙发光)
cta_x, cta_y = 55, 620
cta_w, cta_h = 245, 52
for r in range(14, 0, -2):
    ui_draw.rounded_rectangle(
        [cta_x - r, cta_y - r, cta_x + cta_w + r, cta_y + cta_h + r],
        radius=26 + r,
        fill=(123, 97, 255, int(18 * (1 - r / 14)))
    )

# 按钮主体采用紫渐变
ui_draw.rounded_rectangle(
    [cta_x, cta_y, cta_x + cta_w, cta_y + cta_h],
    radius=26,
    fill=(123, 97, 255, 255),
    outline=(220, 200, 255, 255),
    width=1
)
font_cta = get_font(22, bold=True)
ui_draw.text((cta_x + 38, cta_y + 14), "即刻进入探索 ➔", font=font_cta, fill=(255, 255, 255, 255))

# 底部舞种流派微标
font_sub = get_en_font(16, bold=True)
ui_draw.text((55, 715), "POPPING · LOCKING · BREAKING · HIPHOP · WAACKING", font=font_sub, fill=(140, 130, 175, 200))

# (F) 全图 2px 微发光内边框
ui_draw.rounded_rectangle(
    [1, 1, W - 2, H - 2],
    radius=0,
    outline=(123, 97, 255, 120),
    width=2
)

final_img = Image.alpha_composite(bg, ui_layer).convert('RGB')
final_img.save('/tmp/home_share_v3.jpg', quality=95)

# 同时生成一个“微信聊天分享气泡模拟图”，直观对比
mock_w, mock_h = 750, 950
mock = Image.new("RGB", (mock_w, mock_h), (242, 242, 242))
mdraw = ImageDraw.Draw(mock)

# 模拟微信白色分享卡片
card_x, card_y = 50, 80
card_w, card_h = 650, 780
mdraw.rounded_rectangle(
    [card_x, card_y, card_x + card_w, card_y + card_h],
    radius=16,
    fill=(255, 255, 255),
    outline=(225, 225, 225),
    width=1
)

# 模拟标题
font_mtitle = get_font(32, bold=True)
mdraw.text((card_x + 30, card_y + 35), "街舞人的地下基地：看懂行的内容，", font=font_mtitle, fill=(20, 20, 20))
mdraw.text((card_x + 30, card_y + 80), "找到值得去的地方 🎧", font=font_mtitle, fill=(20, 20, 20))

# 模拟 5:4 分享图片在卡片中的展示
img_w, img_h = 590, int(590 * 4 / 5) # 590 x 472
scaled_share = final_img.resize((img_w, img_h), Image.Resampling.LANCZOS)
mock.paste(scaled_share, (card_x + 30, card_y + 140))

# 模拟卡片底部
font_mfoot = get_font(22, bold=False)
mdraw.line([(card_x + 30, card_y + 650), (card_x + card_w - 30, card_y + 650)], fill=(240, 240, 240), width=1)
mdraw.text((card_x + 30, card_y + 675), "小程序 · 舞岛", font=font_mfoot, fill=(150, 150, 150))

mock.save('/tmp/wechat_mock_preview.jpg', quality=95)
print("Generated /tmp/home_share_v3.jpg & /tmp/wechat_mock_preview.jpg")
