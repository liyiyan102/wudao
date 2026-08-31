/**
 * 轻量 Markdown 行解析器（PRD 4.3 编辑型长内容 · 非社区版 v0.3）
 *
 * 语法子集：
 *   "## 标题"        → H3 章节（19px/700）
 *   "### 标题"       → H4 小节（16px/700）
 *   ">>t 标题"       → Call-out 引言块标题（如"导读"）
 *   ">> 段落"        → Call-out 引言块正文（作者的话，浅紫底+紫左条）
 *   "> 段落"         → Blockquote 块引用（引用他人，灰左线+斜体）
 *   "> —— 出处"      → Blockquote 来源（cite）
 *   "![描述](url)"   → 图片（有 url 渲染真实图；无 url 占位块）
 *   "@[描述](url)"   → 视频
 *   "| 列1 | 列2 |"   → 表格（含表头、对齐方式、数据行）
 *   "- 条目" / "* 条目"  → 无编号列表
 *   "1. 条目" / "1、条目" → 数字编号列表
 *   其余行           → 段落
 *
 * 输出 blocks：[{ type, text, cite?, title?, url?, _start, _end }]
 *   _start/_end = 源文本字符区间（供编辑器预览↔正文联动定位；端侧渲染可忽略）
 */

const IMG_RE = /^!\[([^\]]*)\]\(([^)]+)\)$/
const VIDEO_RE = /^@\[([^\]]*)\]\(([^)]+)\)$/
const BOLD_RE = /\*\*([^*]+)\*\*/g
const UL_RE = /^[-*•]\s+(.+)$/
const OL_RE = /^(\d+)[.)、]\s*(.+)$/

function parseTableLine(line) {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map(c => c.trim())
}

function isDelimiterRow(cells) {
  return cells.length > 0 && cells.every(c => /^:?-+:?$/.test(c))
}

function parseAligns(cells) {
  return cells.map(c => {
    const left = c.startsWith(':')
    const right = c.endsWith(':')
    if (left && right) return 'center'
    if (right) return 'right'
    if (left) return 'left'
    return 'left'
  })
}

function isTableLine(line) {
  const t = line.trim()
  return t.length >= 3 && t.startsWith('|') && t.endsWith('|')
}

/** 行内加粗分段："前**中**后" → [{text:'前'},{text:'中',bold:true},{text:'后'}] */
function parseBold(text) {
  const t = String(text || '')
  const segs = []
  let last = 0, m
  BOLD_RE.lastIndex = 0
  while ((m = BOLD_RE.exec(t))) {
    if (m.index > last) segs.push({ text: t.slice(last, m.index) })
    segs.push({ text: m[1], bold: true })
    last = m.index + m[0].length
  }
  if (last < t.length) segs.push({ text: t.slice(last) })
  return segs.length ? segs : [{ text: t }]
}

function matchListItem(line) {
  let m = line.match(UL_RE)
  if (m) return { kind: 'ul', text: m[1], n: 0 }
  m = line.match(OL_RE)
  if (m) return { kind: 'ol', text: m[2], n: Number(m[1]) }
  return null
}

function parseMarkdown(body) {
  const src = String(body || '')
  const lines = src.split('\n')
  const blocks = []
  let callout = null
  let quote = null
  let list = null
  let table = null
  // 块的源码区间起点（行首字符位置）
  let pos = 0
  let blockStart = 0

  const flushCallout = () => {
    if (callout) {
      const text = callout.text.join('\n')
      blocks.push({ type: 'callout', title: callout.title || '', text, segs: parseBold(text), _start: callout._start, _end: pos })
      callout = null
    }
  }
  const flushQuote = () => {
    if (quote) {
      const text = quote.text.join('\n')
      blocks.push({ type: 'quote', text, segs: parseBold(text), cite: quote.cite || '', _start: quote._start, _end: pos })
      quote = null
    }
  }
  const flushList = () => {
    if (!list) return
    blocks.push({
      type: list.kind,
      items: list.items,
      _start: list._start,
      _end: pos
    })
    list = null
  }
  const flushTable = () => {
    if (table) {
      blocks.push({
        type: 'table',
        headers: table.headers,
        aligns: table.aligns,
        rows: table.rows,
        _start: table._start,
        _end: pos
      })
      table = null
    }
  }
  const flushAll = () => { flushCallout(); flushQuote(); flushList(); flushTable() }
  const startBlock = () => { blockStart = pos }

  for (const raw of lines) {
    const line = raw.trim()
    const lineLen = raw.length

    if (!line) { flushAll(); pos += lineLen + 1; continue }

    const li = matchListItem(line)
    if (isTableLine(line)) {
      flushCallout()
      flushQuote()
      flushList()
      const cells = parseTableLine(line)
      if (!table) {
        table = {
          headers: cells.map(c => ({ text: c, segs: parseBold(c) })),
          aligns: cells.map(() => 'left'),
          rows: [],
          _start: pos
        }
      } else if (isDelimiterRow(cells)) {
        table.aligns = parseAligns(cells)
      } else {
        table.rows.push(cells.map(c => ({ text: c, segs: parseBold(c) })))
      }
    } else if (li) {
      flushAll()
      if (!list) list = { kind: li.kind, items: [], _start: pos }
      list.items.push({ text: li.text, segs: parseBold(li.text), n: li.n })
    } else if (line.indexOf('### ') === 0) {
      flushAll(); startBlock()
      blocks.push({ type: 'h4', text: line.slice(4), _start: pos, _end: pos + lineLen })
    } else if (line.indexOf('## ') === 0) {
      flushAll(); startBlock()
      blocks.push({ type: 'h3', text: line.slice(3), _start: pos, _end: pos + lineLen })
    } else if (line.indexOf('>>t ') === 0) {
      flushList()
      if (!callout) { callout = { title: '', text: [], _start: pos } }
      callout.title = line.slice(4)
    } else if (line.indexOf('>> ') === 0) {
      flushList()
      if (!callout) { callout = { title: '', text: [], _start: pos } }
      callout.text.push(line.slice(3))
    } else if (line.indexOf('> ') === 0) {
      flushList()
      const t = line.slice(2)
      if (t.indexOf('——') === 0 || t.indexOf('--') === 0) {
        const cite = t.replace(/^——\s*/, '')
        if (quote) quote.cite = cite
        else blocks.push({ type: 'quote', text: '', cite, _start: pos, _end: pos + lineLen })
      } else {
        flushCallout()
        if (!quote) quote = { text: [], cite: '', _start: pos }
        quote.text.push(t)
      }
    } else if (IMG_RE.test(line)) {
      flushAll(); startBlock()
      const m = line.match(IMG_RE)
      blocks.push({ type: 'img', text: m[1] || '图片', url: m[2], _start: pos, _end: pos + lineLen })
    } else if (VIDEO_RE.test(line)) {
      flushAll(); startBlock()
      const m = line.match(VIDEO_RE)
      blocks.push({ type: 'video', text: m[1] || '视频', url: m[2], _start: pos, _end: pos + lineLen })
    } else {
      flushAll(); startBlock()
      blocks.push({ type: 'p', text: line, segs: parseBold(line), _start: pos, _end: pos + lineLen })
    }
    pos += lineLen + 1
  }
  flushAll()
  return blocks
}

/** 阅读时长（分钟）：中文约 500 字/分钟 */
function readMinutes(body) {
  const n = String(body || '').replace(/\s/g, '').length
  return Math.max(1, Math.round(n / 500))
}

module.exports = { parseMarkdown, parseBold, readMinutes }
