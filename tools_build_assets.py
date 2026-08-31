# -*- coding: utf-8 -*-
"""
舞岛资产构建脚本 v3：
1. tabBar PNG（81x81）：assets/icons/ 的 tab SVG 纯 Python 光栅化
   （解析 M/L/H/V/C/S/Q/T/Z 贝塞尔 + 扫描线非零绕组填充 + 4x 超采样抗锯齿）
2. styles/icons.wxss：按「图标 → 实际使用的变体」精确生成 data-uri 类
   （变体色值依据《舞岛-视觉设计规范 v1.0》§1.4 Icon 颜色规则）
用法：python3 tools_build_assets.py
图标源：项目内 assets/icons/（自包含，无外部路径依赖）
"""
import base64
import os
import re
import struct
import zlib

ROOT = os.path.dirname(os.path.abspath(__file__))
ICONS = os.path.join(ROOT, 'assets', 'icons')
TAB_OUT = os.path.join(ROOT, 'images', 'tab')
CSS_OUT = os.path.join(ROOT, 'styles')
os.makedirs(TAB_OUT, exist_ok=True)
os.makedirs(CSS_OUT, exist_ok=True)

TAB_INACTIVE = '#7A7A7A'   # 规范 1.4：TabBar 未激活
TAB_ACTIVE = '#534AB7'     # 规范 1.4：TabBar 激活

# 变体色值（规范 1.4）
VARIANT_COLORS = {
    '':        '#B0B0B4',  # Muted2：卡片互动 icon 未操作 / 占位
    '-muted':  '#8A8A8E',  # Muted：导航栏返回箭头 / 搜索 icon / 搭子卡信息行
    '-brand':  '#534AB7',  # 主色：已操作互动 / 详情信息行 / 我的页 cell
    '-white':  '#FFFFFF',  # 白：FAB / 登录按钮 / 品牌块
    '-pale':   '#C4BFEE',  # 封面占位 icon
    '-green':  '#07C160',  # 成功绿
    '-red':    '#FA5151',  # 提醒红
}

# 图标 → 实际使用的变体（按 pages/**/*.wxml 引用统计，未列出的变体不生成）
USED = {
    'icon-back':          ['-muted'],
    'icon-bell':          ['', '-brand'],
    'icon-check-circle':  ['', '-brand', '-white'],
    'icon-chevron-right': [''],
    'icon-clock':         ['', '-brand', '-white'],
    'icon-close':         [''],
    'icon-event':         ['-brand', '-white', ''],
    'icon-eye':           ['', '-brand'],
    'icon-fire':          ['-brand'],
    'icon-heart':         ['', '-brand', '-white'],
    'icon-info':          ['-brand'],
    'icon-history':       ['', '-brand'],
    'icon-image':         ['', '-pale'],
    'icon-list':          ['', '-brand', '-muted'],
    'icon-location':      ['', '-brand', '-white'],
    'icon-my-location':   ['', '-brand'],
    'icon-profile':       ['', '-white'],
    'icon-search':        ['', '-muted'],
    'icon-settings':      ['', '-brand'],
    'icon-share':         ['-white'],
    'icon-star':          ['', '-brand'],
    'icon-trash':         [''],
    'icon-video':         ['-pale'],
}

# tabBar：3 个图标（未激活/激活）—— 非社区版：首页/活动/我的
TAB_ICONS = {
    'icon-home': ('tab-home', TAB_INACTIVE),
    'icon-home-active': ('tab-home-active', TAB_ACTIVE),
    'icon-event': ('tab-event', TAB_INACTIVE),
    'icon-event-active': ('tab-event-active', TAB_ACTIVE),
    'icon-profile': ('tab-profile', TAB_INACTIVE),
    'icon-profile-active': ('tab-profile-active', TAB_ACTIVE),
}

SS = 4  # 超采样倍数


def read_svg(name):
    with open(os.path.join(ICONS, name + '.svg'), 'r', encoding='utf-8') as f:
        return f.read().strip()


# ---------------- SVG path 解析 → 子路径（折线）列表 ----------------

def parse_path(d):
    tokens = re.findall(r'([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:[eE][-+]?\d+)?)', d)
    cmds = []
    for cmd, num in tokens:
        if cmd:
            cmds.append([cmd, []])
        elif cmds:
            cmds[-1][1].append(float(num))

    subs = []
    cur = []
    x = y = 0.0
    sx = sy = 0.0
    prev_cubic_ctrl = None
    prev_quad_ctrl = None

    def flush():
        nonlocal cur
        if len(cur) >= 2:
            subs.append(cur)
        cur = []

    for cmd, args in cmds:
        rel = cmd.islower()
        C = cmd.upper()

        def nx(v):
            return x + v if rel else v

        def ny(v):
            return y + v if rel else v

        j = 0
        if C == 'M':
            while j + 1 < len(args):
                if j == 0:
                    flush()
                    x, y = nx(args[0]), ny(args[1])
                    sx, sy = x, y
                    cur = [(x, y)]
                else:
                    x, y = nx(args[j]), ny(args[j + 1])
                    cur.append((x, y))
                j += 2
        elif C == 'L':
            while j + 1 < len(args):
                x, y = nx(args[j]), ny(args[j + 1])
                cur.append((x, y))
                j += 2
        elif C == 'H':
            while j < len(args):
                x = nx(args[j]); cur.append((x, y)); j += 1
        elif C == 'V':
            while j < len(args):
                y = ny(args[j]); cur.append((x, y)); j += 1
        elif C in ('C', 'S'):
            while j + (6 if C == 'C' else 4) <= len(args):
                if C == 'C':
                    x1, y1, x2, y2, ex, ey = [nx(args[j + k]) if k % 2 == 0 else ny(args[j + k]) for k in range(6)]
                    j += 6
                else:
                    if prev_cubic_ctrl:
                        x1, y1 = 2 * x - prev_cubic_ctrl[0], 2 * y - prev_cubic_ctrl[1]
                    else:
                        x1, y1 = x, y
                    x2, y2 = nx(args[j]), ny(args[j + 1])
                    ex, ey = nx(args[j + 2]), ny(args[j + 3])
                    j += 4
                cur.extend(cubic(x, y, x1, y1, x2, y2, ex, ey))
                prev_cubic_ctrl = (x2, y2)
                x, y = ex, ey
        elif C in ('Q', 'T'):
            while j + (4 if C == 'Q' else 2) <= len(args):
                if C == 'Q':
                    x1, y1 = nx(args[j]), ny(args[j + 1])
                    ex, ey = nx(args[j + 2]), ny(args[j + 3])
                    j += 4
                    prev_quad_ctrl = (x1, y1)
                else:
                    if prev_quad_ctrl:
                        x1, y1 = 2 * x - prev_quad_ctrl[0], 2 * y - prev_quad_ctrl[1]
                    else:
                        x1, y1 = x, y
                    ex, ey = nx(args[j]), ny(args[j + 1])
                    j += 2
                    prev_quad_ctrl = (x1, y1)
                cur.extend(quad(x, y, x1, y1, ex, ey))
                x, y = ex, ey
        elif C == 'A':
            while j + 7 <= len(args):
                ex, ey = nx(args[j + 5]), ny(args[j + 6])
                j += 7
                cur.append((ex, ey))
                x, y = ex, ey
        elif C == 'Z':
            if cur:
                cur.append((sx, sy))
                flush()
                x, y = sx, sy
    flush()
    return subs


def cubic(x0, y0, x1, y1, x2, y2, x3, y3, n=24):
    pts = []
    for k in range(1, n + 1):
        t = k / n
        mt = 1 - t
        a = mt ** 3
        b = 3 * mt * mt * t
        c = 3 * mt * t * t
        dd = t ** 3
        pts.append((a * x0 + b * x1 + c * x2 + dd * x3,
                    a * y0 + b * y1 + c * y2 + dd * y3))
    return pts


def quad(x0, y0, x1, y1, x2, y2, n=16):
    pts = []
    for k in range(1, n + 1):
        t = k / n
        mt = 1 - t
        pts.append((mt * mt * x0 + 2 * mt * t * x1 + t * t * x2,
                    mt * mt * y0 + 2 * mt * t * y1 + t * t * y2))
    return pts


# ---------------- 扫描线非零绕组填充 ----------------

def rasterize(subs, size, color):
    scale = size * SS / 24.0
    edges = []
    for sub in subs:
        for i in range(len(sub) - 1):
            x0, y0 = sub[i]
            x1, y1 = sub[i + 1]
            if y0 != y1:
                edges.append((x0 * scale, y0 * scale, x1 * scale, y1 * scale))

    W = size * SS
    cover = [[0] * W for _ in range(W)]

    for py in range(W):
        y = py + 0.5
        crossings = []
        for (x0, y0, x1, y1) in edges:
            if (y0 <= y < y1) or (y1 <= y < y0):
                t = (y - y0) / (y1 - y0)
                crossings.append((x0 + t * (x1 - x0), 1 if y1 > y0 else -1))
        if not crossings:
            continue
        crossings.sort()
        wind = 0
        span_start = None
        for cx, wd in crossings:
            if wind == 0:
                span_start = cx
            wind += wd
            if wind == 0 and span_start is not None:
                x_from = max(0, int(span_start))
                x_to = min(W - 1, int(cx))
                for px in range(x_from, x_to + 1):
                    cover[py][px] = 1
                span_start = None

    r, g, b = color
    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            s = 0
            for dy in range(SS):
                for dx in range(SS):
                    s += cover[y * SS + dy][x * SS + dx]
            a = int(round(255.0 * s / (SS * SS)))
            row.append((r, g, b, a))
        pixels.append(row)
    return pixels


def write_png(path, pixels):
    raw = b''
    for row in pixels:
        raw += b'\x00' + b''.join(bytes(p) for p in row)

    def chunk(t, d):
        return (struct.pack('>I', len(d)) + t + d +
                struct.pack('>I', zlib.crc32(t + d) & 0xffffffff))

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', len(pixels[0]), len(pixels), 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


def hex2rgb(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def extract_path_d(svg):
    m = re.search(r'\sd="([^"]+)"', svg)
    return m.group(1) if m else ''


# ---------------- 1. tabBar PNG ----------------

for svg_name, (out_name, color) in TAB_ICONS.items():
    subs = parse_path(extract_path_d(read_svg(svg_name)))
    pixels = rasterize(subs, 81, hex2rgb(color))
    write_png(os.path.join(TAB_OUT, out_name + '.png'), pixels)
    opaque = sum(1 for row in pixels for p in row if p[3] > 0)
    print('ok  %-24s 覆盖 %.1f%%' % (out_name + '.png', 100.0 * opaque / (81 * 81)))

# ---------------- 2. 页面内图标 WXSS（仅生成实际使用的变体） ----------------

lines = [
    '/* 舞岛图标库：由 tools_build_assets.py v3 生成（源：assets/icons/*.svg）',
    '   变体色值依据《舞岛-视觉设计规范 v1.0》§1.4；仅生成 pages 实际引用的类 */'
]
count = 0
for name, variants in USED.items():
    raw = read_svg(name)
    short = name.replace('icon-', '')
    for suffix in variants:
        svg = raw.replace('currentColor', VARIANT_COLORS[suffix])
        b = base64.b64encode(svg.encode('utf-8')).decode('ascii')
        lines.append('.ic-%s%s { background-image: url("data:image/svg+xml;base64,%s"); }' % (short, suffix, b))
        count += 1

with open(os.path.join(CSS_OUT, 'icons.wxss'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')
print('ok  styles/icons.wxss (%d classes, 源 26 个 SVG)' % count)
