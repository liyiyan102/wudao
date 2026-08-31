# -*- coding: utf-8 -*-
"""一次性脚本：生成 tabBar 图标（81x81 PNG，线性风格，零第三方依赖）。"""
import os
import struct
import zlib

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'tab')
os.makedirs(OUT, exist_ok=True)

W = H = 81
GRAY = (156, 163, 175, 255)
BRAND = (255, 77, 46, 255)
WHITE = (255, 255, 255, 255)


def write_png(path, pixels):
    raw = b''
    for row in pixels:
        raw += b'\x00' + b''.join(bytes(p) for p in row)

    def chunk(t, d):
        return (struct.pack('>I', len(d)) + t + d +
                struct.pack('>I', zlib.crc32(t + d) & 0xffffffff))

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


def canvas():
    return [[(0, 0, 0, 0)] * W for _ in range(H)]


def px(c, x, y, color):
    xi, yi = int(round(x)), int(round(y))
    if 0 <= xi < W and 0 <= yi < H:
        c[yi][xi] = color


def ring(c, cx, cy, r, w, color, y_max=None):
    for y in range(H):
        if y_max is not None and y > y_max:
            continue
        for x in range(W):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if abs(d - r) <= w / 2.0:
                c[y][x] = color


def disc(c, cx, cy, r, color):
    for y in range(H):
        for x in range(W):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                c[y][x] = color


def rect(c, x0, y0, x1, y1, color):
    for y in range(int(y0), int(y1) + 1):
        for x in range(int(x0), int(x1) + 1):
            px(c, x, y, color)


def line(c, x0, y0, x1, y1, w, color):
    n = int(max(abs(x1 - x0), abs(y1 - y0)) * 3) + 1
    for i in range(n + 1):
        t = i / float(n)
        x = x0 + (x1 - x0) * t
        y = y0 + (y1 - y0) * t
        for dy in range(-(w // 2), w // 2 + 1):
            for dx in range(-(w // 2), w // 2 + 1):
                px(c, x + dx, y + dy, color)


def draw_feed(color):
    """内容 tab：信息流卡片层叠"""
    c = canvas()
    rect(c, 16, 14, 65, 30, color)      # 上卡片外框（两条横线）
    rect(c, 12, 38, 61, 54, color)
    line(c, 20, 21, 57, 21, 6, WHITE)   # 上卡片内容留白线
    line(c, 20, 45, 53, 45, 6, WHITE)
    rect(c, 8, 62, 57, 78, color)
    line(c, 16, 69, 49, 69, 6, WHITE)
    return c


def draw_buddy(color):
    """搭子 tab：两个人"""
    c = canvas()
    ring(c, 25, 24, 10, 6, color)                 # 左头
    ring(c, 25, 55, 17, 6, color, y_max=52)       # 左身（上半弧）
    ring(c, 57, 30, 8, 6, color)                  # 右头
    ring(c, 57, 56, 13, 6, color, y_max=53)       # 右身
    return c


def draw_profile(color):
    """我的 tab：单人"""
    c = canvas()
    ring(c, 40, 26, 12, 6, color)
    ring(c, 40, 66, 23, 6, color, y_max=62)
    return c


ICONS = {
    'tab-home': draw_feed,
    'tab-buddy': draw_buddy,
    'tab-profile': draw_profile,
}

for name, fn in ICONS.items():
    write_png(os.path.join(OUT, name + '.png'), fn(GRAY))
    write_png(os.path.join(OUT, name + '-active.png'), fn(BRAND))
    print('ok', name)

print('done ->', OUT)
