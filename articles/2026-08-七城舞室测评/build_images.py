#!/usr/bin/env python3
"""Richer city cards with quotes + scores for articles/2026-08-七城舞室测评."""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
IMG = ROOT / "images"
RAW = Path("/Users/liyiyan/CodeBuddy/兴趣社区/agents/xhs-posts/wushi-7cities/raw")
IMG.mkdir(parents=True, exist_ok=True)
W, H = 1080, 1440

CITIES = [
    {
        "name": "北京",
        "tag": "有分数 · 有报价 · 有原话",
        "lines": [
            "Tempo大悦城｜约60元/1.5h · 满课约20人",
            "「第4排视线挡」· 22:00放课 · 有云台",
            "Tempo通州｜⭐⭐⭐⭐ · 无独立厕所",
            "欲非｜约70+/节 · 20–30人 · 「AV画质」",
            "OCEAN国贸｜综合85分(B) · 次卡约89–112",
            "硬件5 服务5 · 教学3 · 「纯Jazz每天约1节」",
        ],
        "hot": "TI吐槽：「停卡还让我出示出差证明？」· 赞175",
        "tone": (28, 42, 68),
        "accent": (255, 196, 92),
    },
    {
        "name": "上海",
        "tag": "63家盘点 · Bounce避雷",
        "lines": [
            "盘点帖：「大概有63家」还没统计完 · 赞1456",
            "「师资太给力……芭蕾和现代也很多」",
            "Bounce避雷 · 赞254：",
            "「有效期内踢群」",
            "「逼签2个月退款单」· 到期未退",
            "「威胁删差评不然不退款」",
        ],
        "hot": "信号：新人门槛共鸣 + 退费纠纷要盯合同",
        "tone": (55, 28, 40),
        "accent": (255, 140, 160),
    },
    {
        "name": "杭州",
        "tag": "Absurdism单店数字对照",
        "lines": [
            "Five｜小班8–10人 · 次卡约70+（心里线≤50）",
            "Six｜次卡约50出头 · 团课上限约40",
            "Sister｜「看不见镜子里的自己」· 月卡折后1280",
            "BA｜活动次卡约37.5/节 · 担心后期变挤",
            "7plab｜月卡999 · 次卡60多",
            "「这附近服务最差的一家」",
        ],
        "hot": "建议：按通勤逐家比，别只看低价次卡",
        "tone": (24, 52, 48),
        "accent": (120, 220, 190),
    },
    {
        "name": "深圳",
        "tag": "星级测评 · 通勤优先",
        "lines": [
            "Dylan：「只取决于通勤&授课风格」· 赞278",
            "UN｜难度≈CLAP×0.7 · 课75分钟",
            "教学⭐⭐⭐⭐⭐ · 开业可到8x/节",
            "做任务可压到4x–6x · 公开课「挤死了」",
            "HTD｜「私心最爱的OldSchool」",
            "约5x/节 · 厕所⭐⭐½（电器城公厕）",
        ],
        "hot": "老师互通多：先跟风格，再跟店",
        "tone": (20, 36, 58),
        "accent": (110, 180, 255),
    },
    {
        "name": "长沙",
        "tag": "人数 · 周费 · 退费雷",
        "lines": [
            "odog｜整栋楼 · 「平均每节课70人」· 赞186",
            "仍「不会感觉拥挤」· 适合体能更好的",
            "VIEW｜周6XX / 月2XXX（仅含课）· 赞109",
            "日程：体能+基本功+片段 · 电梯等10–15分",
            "作者：「第二周体能课过猛中暑」",
            "洋湖｜被迫2799 · 剩41节不退 · 赞33",
        ],
        "hot": "合同：「特价不退」「扣50%运营费」",
        "tone": (58, 32, 24),
        "accent": (255, 170, 90),
    },
    {
        "name": "南京",
        "tag": "进阶四户 · 舞岛细节",
        "lines": [
            "进阶常提：dday / ib / fans / 岛",
            "舞岛｜独栋三层 · 5教室 · 赞53",
            "活动：「两三百畅跳一周」",
            "优点：师资强、舞种全、氛围好",
            "问题：管理弱 · 视频运镜猛/偏C位/录不全",
            "另有swag老师篇 · 赞112 · 按老师选更准",
        ],
        "hot": "总结原话：OS&全舞种可冲，服务视频一般",
        "tone": (40, 28, 58),
        "accent": (200, 170, 255),
    },
    {
        "name": "合肥",
        "tag": "约课难度 · 单价 · 避雷",
        "lines": [
            "UN｜热门课难抢 · 「不会数拍」「不带跳」",
            "适宜：拍热舞/玩票 · 零基础求进步慎选",
            "DYF｜低价卡约25–35/节 · 「没啥大雷点」",
            "通病：「商业舞房……不带基本功」",
            "漫舞蹈避雷｜赞52：",
            "承诺延期跳完100次→超一年不退 · 一年三改址",
        ],
        "hot": "求推荐帖：「un约课真的太难约了」",
        "tone": (32, 44, 36),
        "accent": (180, 230, 120),
    },
]


def font(size: int):
    for p in [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/Supplemental/Songti.ttc",
    ]:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size=size, index=0)
            except Exception:
                pass
    return ImageFont.load_default()


def transform_bg(path: Path | None, tone):
    if path and path.exists():
        im = Image.open(path).convert("RGB")
        im = ImageOps.fit(im, (W, H), Image.Resampling.LANCZOS)
        im = im.filter(ImageFilter.GaussianBlur(16))
        im = ImageEnhance.Color(im).enhance(0.3)
        im = ImageEnhance.Brightness(im).enhance(0.5)
    else:
        im = Image.new("RGB", (W, H), tone)
    wash = Image.new("RGB", (W, H), tone)
    return Image.blend(im, wash, 0.55)


def draw_wrapped(draw, text, xy, font_obj, fill, max_width, line_gap=6):
    x, y = xy
    line = ""
    for ch in text:
        test = line + ch
        if draw.textlength(test, font=font_obj) <= max_width:
            line = test
        else:
            draw.text((x, y), line, font=font_obj, fill=fill)
            y += font_obj.size + line_gap
            line = ch
    if line:
        draw.text((x, y), line, font=font_obj, fill=fill)
        y += font_obj.size + line_gap
    return y


def make_cover():
    atmos = IMG / "cover-atmosphere.png"
    raws = list(RAW.glob("*.jpg")) if RAW.exists() else []
    bg = transform_bg(atmos if atmos.exists() else (raws[0] if raws else None), (18, 22, 30))
    # bottom gradient
    grad = Image.new("L", (1, H))
    for y in range(H):
        v = int(min(230, max(0, (y - H * 0.42) / (H * 0.58) * 230))) if y > H * 0.42 else 0
        grad.putpixel((0, y), v)
    grad = grad.resize((W, H))
    dark = Image.new("RGB", (W, H), (8, 10, 14))
    bg = Image.composite(dark, bg, grad)
    draw = ImageDraw.Draw(bg)
    draw.text((80, 860), "7城舞室测评", font=font(72), fill=(255, 255, 255))
    draw.text((80, 960), "原话 · 分数 · 报价", font=font(40), fill=(255, 196, 92))
    draw.text((80, 1040), "北京 上海 杭州 深圳", font=font(30), fill=(210, 214, 220))
    draw.text((80, 1090), "长沙 南京 合肥", font=font(30), fill=(210, 214, 220))
    draw.text((80, 1200), "摘自公开测评帖 · 非广告", font=font(24), fill=(150, 156, 165))
    out = IMG / "00_cover.jpg"
    bg.save(out, quality=93)
    return out


def make_city(idx: int, city: dict, raw_map: dict):
    bg = transform_bg(raw_map.get(city["name"]), city["tone"])
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(overlay).rounded_rectangle((40, 60, W - 40, H - 60), radius=28, fill=(8, 10, 14, 215))
    bg = Image.alpha_composite(bg.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(bg)
    accent = city["accent"]
    draw.text((80, 95), f"{idx:02d} / {city['name']}", font=font(26), fill=accent)
    draw.text((80, 145), f"{city['name']}｜数字与原话", font=font(48), fill=(255, 255, 255))
    draw.text((80, 220), city["tag"], font=font(26), fill=(190, 196, 205))
    y = 290
    for line in city["lines"]:
        draw.ellipse((80, y + 10, 94, y + 24), fill=accent)
        y = draw_wrapped(draw, line, (110, y), font(26), (235, 238, 242), W - 200, line_gap=8)
        y += 14
    box = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(box).rounded_rectangle((80, H - 250, W - 80, H - 100), radius=16, fill=(*accent, 235))
    bg = Image.alpha_composite(bg.convert("RGBA"), box).convert("RGB")
    draw = ImageDraw.Draw(bg)
    draw.text((104, H - 225), "社区原话 / 热议", font=font(22), fill=(20, 20, 20))
    draw_wrapped(draw, city["hot"], (104, H - 185), font(26), (20, 20, 20), W - 220, line_gap=6)
    out = IMG / f"{idx:02d}_{city['name']}.jpg"
    bg.save(out, quality=93)
    return out


def make_closing():
    bg = Image.new("RGB", (W, H), (16, 18, 22))
    draw = ImageDraw.Draw(bg)
    draw.text((80, 140), "对照表怎么用", font=font(52), fill=(255, 255, 255))
    tips = [
        "看报价：同城先比次卡/月卡口径",
        "看人数：20人教室 vs 70人楼",
        "看评分：有六维/星级的优先对照",
        "看原话：退费、停卡、改址别略过",
        "体验≥2次再办大课包",
        "数字会过时，进店再问一遍",
    ]
    y = 260
    for t in tips:
        draw.text((80, y), "·  " + t, font=font(30), fill=(220, 224, 230))
        y += 72
    draw.text((80, H - 200), "你在哪座城？评论区报坐标", font=font(30), fill=(255, 196, 92))
    out = IMG / "99_howto.jpg"
    bg.save(out, quality=93)
    return out


def main():
    raw_map = {}
    if RAW.exists():
        for p in RAW.glob("*.jpg"):
            raw_map[p.name.split("_")[0]] = p
    make_cover()
    for i, city in enumerate(CITIES, 1):
        make_city(i, city, raw_map)
    make_closing()
    print("ok", IMG)


if __name__ == "__main__":
    main()
