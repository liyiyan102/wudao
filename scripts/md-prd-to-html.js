#!/usr/bin/env node
/**
 * Sync docs/舞岛MMVP-PRD-非社区版.md → docs/舞岛MMVP-PRD-非社区版.html
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const mdPath = path.join(root, 'docs', '舞岛MMVP-PRD-非社区版.md')
const htmlPath = path.join(root, 'docs', '舞岛MMVP-PRD-非社区版.html')

const md = fs.readFileSync(mdPath, 'utf8').replace(/\r\n/g, '\n')
const lines = md.split('\n')

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inline(s) {
  let t = esc(s)
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
  t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  return t
}

function padNo(n) {
  return String(n).padStart(2, '0')
}

function splitCells(row) {
  return row.replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) {
    return c.trim()
  })
}

function isSepRow(row) {
  return /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(row.trim())
}

let i = 0
let title = '舞岛 MMVP PRD · 非社区版'
const versionNotes = []
const toc = []
let bodyHtml = ''
let currentSection = null
const paraBuf = []

function flushParagraph() {
  if (!paraBuf.length) return
  const text = paraBuf.join(' ').trim()
  paraBuf.length = 0
  if (!text) return
  bodyHtml += '<p>' + inline(text) + '</p>\n'
}

function startSection(num, name) {
  flushParagraph()
  if (currentSection != null) bodyHtml += '</section>\n\n'
  const id = 's' + num
  toc.push({ id: id, num: num, name: name })
  bodyHtml += '<!-- ============ ' + num + ' ' + name + ' ============ -->\n'
  bodyHtml += '<section id="' + id + '">\n'
  bodyHtml += '  <h2><span class="no">' + padNo(num) + '</span>' + esc(name) + '</h2>\n'
  currentSection = num
}

function parseTable() {
  const rows = []
  while (i < lines.length && lines[i].trim().charAt(0) === '|') {
    rows.push(lines[i].trim())
    i++
  }
  if (rows.length < 2) return
  const headers = splitCells(rows[0])
  let start = 1
  if (isSepRow(rows[1])) start = 2
  bodyHtml += '<table>\n<tr>'
  headers.forEach(function (h) {
    bodyHtml += '<th>' + inline(h) + '</th>'
  })
  bodyHtml += '</tr>\n'
  for (let r = start; r < rows.length; r++) {
    const cells = splitCells(rows[r])
    bodyHtml += '<tr>'
    cells.forEach(function (c) {
      let cell = inline(c)
      if (/^✅/.test(c)) cell = '<span class="chip ok">' + inline(c) + '</span>'
      else if (/^❌/.test(c)) cell = '<span class="chip no">' + inline(c) + '</span>'
      bodyHtml += '<td>' + cell + '</td>'
    })
    bodyHtml += '</tr>\n'
  }
  bodyHtml += '</table>\n'
}

function parseCode() {
  i++ // skip opening fence
  const buf = []
  while (i < lines.length && !lines[i].startsWith('```')) {
    buf.push(lines[i])
    i++
  }
  if (i < lines.length) i++ // skip closing fence
  bodyHtml += '<pre>' + esc(buf.join('\n')) + '</pre>\n'
}

function parseList(ordered) {
  const items = []
  const re = ordered ? /^\s*(\d+)\.\s+(.*)$/ : /^\s*[-*]\s+(.*)$/
  while (i < lines.length) {
    const m = lines[i].match(re)
    if (!m) break
    items.push(ordered ? m[2] : m[1])
    i++
  }
  if (!items.length) {
    i++ // safety: never stall
    return
  }
  if (ordered) {
    bodyHtml += '<ol style="margin:10px 0 16px;padding-left:22px;font-size:13px;color:var(--ink2);line-height:1.7;">\n'
    items.forEach(function (it) {
      bodyHtml += '<li>' + inline(it) + '</li>\n'
    })
    bodyHtml += '</ol>\n'
  } else {
    bodyHtml += '<ul class="ac">\n'
    items.forEach(function (it) {
      bodyHtml += '<li>' + inline(it) + '</li>\n'
    })
    bodyHtml += '</ul>\n'
  }
}

// Header: H1 + leading blockquotes
while (i < lines.length) {
  const line = lines[i]
  if (line.startsWith('# ')) {
    title = line.slice(2).trim()
    i++
    continue
  }
  if (line.startsWith('>')) {
    const note = line.replace(/^>\s?/, '')
    if (note) versionNotes.push(note)
    i++
    continue
  }
  if (!line.trim()) {
    i++
    continue
  }
  break
}

let guard = 0
while (i < lines.length) {
  if (++guard > lines.length * 3) {
    console.error('infinite loop at i=', i, 'line=', JSON.stringify(lines[i]))
    process.exit(1)
  }
  const line = lines[i]
  const trimmed = line.trim()

  if (!trimmed || trimmed === '---') {
    flushParagraph()
    i++
    continue
  }

  if (trimmed.startsWith('```')) {
    flushParagraph()
    parseCode()
    continue
  }

  if (trimmed.charAt(0) === '|' && trimmed.charAt(trimmed.length - 1) === '|') {
    flushParagraph()
    parseTable()
    continue
  }

  if (/^##\s+/.test(trimmed)) {
    const raw = trimmed.replace(/^##\s+/, '')
    const m = raw.match(/^(\d+)\.\s+(.*)$/)
    if (m) startSection(Number(m[1]), m[2])
    else startSection(toc.length + 1, raw)
    i++
    continue
  }

  if (/^###\s+/.test(trimmed)) {
    flushParagraph()
    bodyHtml += '<h3>' + inline(trimmed.replace(/^###\s+/, '')) + '</h3>\n'
    i++
    continue
  }

  if (/^####\s+/.test(trimmed)) {
    flushParagraph()
    bodyHtml += '<h4>' + inline(trimmed.replace(/^####\s+/, '')) + '</h4>\n'
    i++
    continue
  }

  if (/^\s*[-*]\s+/.test(line)) {
    flushParagraph()
    parseList(false)
    continue
  }

  if (/^\s*\d+\.\s+/.test(line)) {
    flushParagraph()
    parseList(true)
    continue
  }

  if (trimmed.startsWith('>')) {
    flushParagraph()
    bodyHtml += '<div class="note note-info">' + inline(trimmed.replace(/^>\s?/, '')) + '</div>\n'
    i++
    continue
  }

  paraBuf.push(trimmed)
  i++
}

flushParagraph()
if (currentSection != null) bodyHtml += '</section>\n'

const alertHtml = versionNotes.map(inline).join('<br>\n    ')
const tocHtml = toc.map(function (t) {
  const short = t.name.replace(/（.*）/, '').slice(0, 20)
  return '<a href="#' + t.id + '">' + padNo(t.num) + ' ' + esc(short) + '</a>'
}).join('\n  ')

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
  :root{
    --ink:#1a1a1a; --ink2:#3d3d3d; --muted:#8a8a8e; --muted2:#b0b0b4;
    --line:#ededed; --line2:#f7f7f8; --bg:#f7f7f7; --card:#ffffff;
    --purple:#534ab7; --purple-d:#3c3489; --purple-bg:#eeedfe;
    --red:#fa5151; --green:#07c160; --amber:#f5a623;
  }
  *{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;}
  body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;color:var(--ink);background:#fff;line-height:1.6;}
  .page{max-width:920px;margin:0 auto;padding:48px 32px 80px;}
  .hd{margin-bottom:40px;border-bottom:2px solid var(--purple);padding-bottom:20px;}
  .hd h1{font-size:24px;font-weight:700;letter-spacing:-0.3px;}
  .hd .meta{display:flex;gap:20px;margin-top:10px;font-size:12px;color:var(--muted);flex-wrap:wrap;}
  .hd .meta b{color:var(--ink);}
  .hd .tag{display:inline-block;background:var(--purple);color:#fff;font-size:11px;padding:3px 10px;border-radius:4px;margin-bottom:12px;font-weight:600;}
  .hd .alert{background:#FFF7E6;border:1px solid #FFD591;border-radius:8px;padding:14px 16px;margin-top:16px;font-size:13px;color:#8C5A00;line-height:1.7;}
  .hd .alert b{color:#8C5A00;}

  nav.toc{background:var(--bg);border-radius:8px;padding:14px 18px;margin-bottom:32px;display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12px;}
  nav.toc a{color:var(--purple-d);text-decoration:none;}
  nav.toc a:hover{text-decoration:underline;}

  section{margin-bottom:40px;}
  h2{font-size:19px;font-weight:700;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:8px;}
  h2 .no{background:var(--purple);color:#fff;font-size:12px;padding:3px 8px;border-radius:4px;font-weight:600;}
  h3{font-size:15px;font-weight:600;margin:24px 0 10px;color:var(--purple-d);}
  h4{font-size:14px;font-weight:600;margin:18px 0 8px;}
  p{margin-bottom:10px;font-size:14px;color:var(--ink2);}

  table{width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:13px;}
  th{background:var(--bg);text-align:left;padding:10px 12px;font-weight:600;border-bottom:2px solid var(--line);}
  td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top;}
  tr:hover td{background:#fafafa;}
  td b{color:var(--ink);}

  .note{border-radius:8px;padding:14px 16px;margin:12px 0;font-size:13px;line-height:1.7;}
  .note-info{background:var(--purple-bg);border-left:3px solid var(--purple);}
  .note-warn{background:#FFF7E6;border-left:3px solid var(--amber);}
  .note-info b,.note-warn b{color:var(--purple-d);}

  .chip{display:inline-block;font-size:11px;padding:2px 8px;border-radius:4px;font-weight:600;margin-right:4px;}
  .chip.ok{background:#d4edda;color:#155724;}
  .chip.no{background:#f8d7da;color:#721c24;}

  ul.ac{list-style:none;margin:10px 0 16px;padding:0;}
  ul.ac li{font-size:13px;padding:6px 0 6px 20px;position:relative;color:var(--ink2);line-height:1.6;}
  ul.ac li::before{content:"✓";position:absolute;left:0;color:var(--purple);font-weight:700;}

  pre{background:var(--bg);border-radius:8px;padding:16px;font-size:12px;overflow-x:auto;line-height:1.6;color:var(--ink2);font-family:"SF Mono",Monaco,monospace;white-space:pre-wrap;}
  code{background:var(--bg);padding:2px 6px;border-radius:3px;font-size:12px;font-family:"SF Mono",Monaco,monospace;}

  footer{border-top:1px solid var(--line);margin-top:60px;padding-top:20px;font-size:12px;color:var(--muted);text-align:center;}
</style>
</head>
<body>
<div class="page">

<div class="hd">
  <span class="tag">PRD · v1.4 非社区版 · 人格测试 + 代发撮合</span>
  <h1>${esc(title)}</h1>
  <div class="meta">
    <span>版本 <b>v1.4 · 街舞人格测试 + 全站分享策略</b></span>
    <span>日期 <b>2026-08-31</b></span>
    <span>同步自 <b>舞岛MMVP-PRD-非社区版.md</b></span>
    <span>状态 <b>已对齐实际功能</b></span>
  </div>
  <div class="alert">
    ${alertHtml}
  </div>
</div>

<nav class="toc">
  ${tocHtml}
</nav>

${bodyHtml}

<footer>
  舞岛 MMVP PRD · 非社区版 v1.4 · 由 Markdown 同步生成 · 2026-08-31
</footer>

</div>
</body>
</html>
`

fs.writeFileSync(htmlPath, html, 'utf8')
console.log('OK', htmlPath)
console.log('sections', toc.length)
console.log('bytes', Buffer.byteLength(html))
