/**
 * 批量导入（admin 鉴权）
 * POST /api/admin/import  multipart: file=.xlsx/.csv
 *   列：分类 | 标题 | 副标题 | 正文 | 封面图URL | 城市 | 作者昵称 | 标签(分号分隔) | 置顶(是/否)
 *   正文支持：## H3 / ### H4 / - 无编号列表 / 1. 数字编号 / >> Call-out / > Blockquote / **加粗** / ![图](url) / @[视频](url)
 * 行级校验：分类非法/标题为空 → 该行报错跳过，不影响其他行
 *
 * GET /api/admin/import/template.xlsx  下载模板
 *   分类列带下拉选项（Excel 数据验证）；表头 + 3 行示例（含图片/视频语法演示）
 */
const express = require('express')
const multer = require('multer')
const XLSX = require('xlsx')
const ExcelJS = require('exceljs')
const jwt = require('jsonwebtoken')
const config = require('../config')
const store = require('../store')
const { ok, fail } = require('../utils/resp')
const { resolveMediaRef, rewriteBodyMedia, ensureDirs } = require('../utils/import-media')

const router = express.Router()
ensureDirs()

const COLS = ['分类', '标题', '副标题', '正文', '封面图URL', '城市', '作者昵称', '标签', '置顶']
const CAT_KEYS = Object.keys(store.CATS) // outfit/recovery/culture/studio/fresh
const CAT_NAMES = CAT_KEYS.map(k => store.CATS[k].name)
/** 分类别名（常见简称容错） */
const CAT_ALIASES = {
  '文化': 'culture', '文化历史': 'culture',
  '舞室': 'studio', '探店': 'studio', '舞室介绍': 'studio',
  '康复': 'recovery', '穿搭': 'outfit',
  '新鲜事': 'fresh', '新鲜': 'fresh', '快讯': 'fresh',
  '八卦': 'fresh', '圈内': 'fresh', '圈内八卦': 'fresh'
}

function auth(req, res, next) {
  // 支持 Authorization header 或 ?token= 查询参数（模板下载用）
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.query.token
  try {
    const payload = jwt.verify(token, config.JWT_SECRET)
    if (payload.role !== 'admin') throw new Error()
    next()
  } catch (e) {
    fail(res, 401, '请先登录', 401)
  }
}

/* ---------------- 模板下载（exceljs：分类下拉 + 示例） ---------------- */

router.get('/template.xlsx', auth, async (req, res) => {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('内容导入')

  // 表头
  const header = ws.addRow(COLS)
  header.eachCell(c => {
    c.font = { bold: true, color: { argb: 'FF3C3489' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEDFE' } }
  })
  ws.getColumn(1).width = 12   // 分类
  ws.getColumn(2).width = 32   // 标题
  ws.getColumn(3).width = 24   // 副标题
  ws.getColumn(4).width = 70   // 正文
  ws.getColumn(5).width = 34   // 封面图URL
  ws.getColumn(6).width = 8    // 城市
  ws.getColumn(7).width = 14   // 作者
  ws.getColumn(8).width = 18   // 标签
  ws.getColumn(9).width = 7    // 置顶

  // 示例 1：完整语法（Call-out/H3/引用/加粗/图片/视频 + 封面）
  ws.addRow([
    '文化', '嘻哈从哪来：一场持续 50 年的派对', '从 Bronx 街头到全球舞台',
    '>>t 导读\n>> 编辑部推荐语，支持**加粗**。\n\n## 第一节 起点\n正文段落，可插入图片与视频：\n\n![书封](https://example.com/book.jpg)\n\n@[纪录片片段](https://example.com/video.mp4)\n\n### 要点\n- 无编号列表用减号加空格\n- 也可用星号：* 条目\n\n1. 数字编号用「1. 」或「1、」\n2. 连续几行会自动连成一组\n\n> 引用原文内容\n> —— 《某本书》',
    'https://example.com/book.jpg',
    '北京', '舞岛官方', '嘻哈;历史', '否'
  ]).alignment = { wrapText: true, vertical: 'top' }

  // 示例 2：本地文件名（先把 book.jpg 放进 server/data/uploads/）
  ws.addRow([
    '穿搭', '护腕怎么选：材质与支撑力', '',
    '练 powermove 优先看支撑。\n\n### 材质对比\n- **硬质支撑**适合风车类动作\n- 软质护腕适合日常训练\n\n1. 先看支撑力\n2. 再看透气\n3. 最后看价格\n\n![护腕](book.jpg)',
    'book.jpg', '上海', '上场衣橱', '装备', '否'
  ]).alignment = { wrapText: true, vertical: 'top' }

  // 示例 3：置顶 + 封面
  ws.addRow([
    '新鲜事', 'KOD 中国区预选 8 月开打', '直通世界总决赛',
    '四舞种同台竞技，优胜者直通 KOD 世界总决赛。\n\n## 报名\n1. 打开官方通道\n2. 填写舞种与城市\n3. 截止 8 月 20 日',
    'https://example.com/kod.jpg',
    '北京', '赛事速报局', 'KOD;赛事', '是'
  ]).alignment = { wrapText: true, vertical: 'top' }

  // 分类列下拉（A2:A500，数据验证）
  ws.getDataValidator = ws.getDataValidator || null
  const dv = {
    type: 'list',
    allowBlank: true,
    formulae: [`"${CAT_NAMES.join(',')}"`],
    showErrorMessage: true,
    errorTitle: '分类不合法',
    error: `请从下拉选择：${CAT_NAMES.join(' / ')}`
  }
  for (let row = 2; row <= 500; row++) {
    const cell = ws.getCell('A' + row)
    cell.dataValidation = Object.assign({}, dv)
  }

  // 置顶列下拉（I 列：是/否）
  const dvPin = {
    type: 'list', allowBlank: true,
    formulae: ['"是,否"'],
    showErrorMessage: true, errorTitle: '仅填 是/否', error: '置顶列只能填 是 或 否'
  }
  for (let row = 2; row <= 500; row++) {
    ws.getCell('I' + row).dataValidation = Object.assign({}, dvPin)
  }

  const rules = wb.addWorksheet('正文规则')
  rules.columns = [
    { header: '语法', key: 'a', width: 22 },
    { header: '写法（单独成行）', key: 'b', width: 36 },
    { header: '效果', key: 'c', width: 36 }
  ]
  rules.getRow(1).eachCell(c => {
    c.font = { bold: true, color: { argb: 'FF3C3489' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEDFE' } }
  })
  ;[
    ['无编号列表', '- 条目  或  * 条目', '圆点列表，连续几行合成一组'],
    ['数字编号列表', '1. 条目  或  1、条目', '按行首数字显示编号'],
    ['章节标题 H3', '## 标题', '大标题'],
    ['小节标题 H4', '### 标题', '小标题'],
    ['Call-out 导读', '>>t 导读 然后下一行 >> 正文', '紫色提示块'],
    ['Blockquote 引用', '> 引用文字  出处写 > —— 书名', '灰色引用块'],
    ['加粗', '正文里写 **加粗**', '加粗'],
    ['图片', '![说明](图片URL或本地文件名)', '正文插图'],
    ['视频', '@[说明](视频URL或本地文件名)', '正文视频'],
    ['文件放哪', 'server/data/uploads/', '后台上传和批量导入共用这一目录；表格里只填文件名']
  ].forEach(r => rules.addRow(r))
  rules.getColumn(1).font = { name: 'Calibri' }

  const buf = await wb.xlsx.writeBuffer()
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=wudao-import-template.xlsx')
  res.send(Buffer.from(buf))
})

/* ---------------- 批量导入 ---------------- */

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }).single('file')

router.post('/', auth, (req, res) => {
  upload(req, res, err => {
    if (err) return fail(res, 4201, '文件过大（≤10MB）')
    if (!req.file) return fail(res, 4201, '缺少文件')

    let wb
    try {
      wb = XLSX.read(req.file.buffer, { type: 'buffer' })
    } catch (e) {
      return fail(res, 4201, '无法解析文件（仅支持 .xlsx / .csv）')
    }
    const ws = wb.Sheets[wb.SheetNames[0]]
    if (!ws) return fail(res, 4201, '空文件')

    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).filter(r => r.some(c => String(c).trim()))
    if (!rows.length) return fail(res, 4201, '表格无数据行')

    // 表头校验（宽松：首行含"标题""正文"即认可，列按模板顺序）
    const header = rows[0].map(c => String(c).trim())
    const colIdx = {}
    COLS.forEach((c, i) => { colIdx[c] = header.indexOf(c) === -1 ? i : header.indexOf(c) })

    const db = store.getDB()
    const result = { total: 0, success: 0, failed: 0, errors: [], createdIds: [] }
    let sortCursor = store.nextSort(db.posts)

    rows.slice(1).forEach((r, idx) => {
      const line = idx + 2 // Excel 行号（含表头）
      const get = name => {
        const i = colIdx[name]
        return i > -1 && r[i] !== undefined ? String(r[i]).trim() : ''
      }
      const catName = get('分类')
      const title = get('标题').slice(0, 40)
      const bodyRaw = String(r[colIdx['正文']] || '').trim()

      result.total++
      if (!catName) return fail2(`第${line}行：分类为空`)
      const catKey = CAT_KEYS.find(k => store.CATS[k].name === catName || k === catName) || CAT_ALIASES[catName]
      if (!catKey) return fail2(`第${line}行：分类「${catName}」不合法（${CAT_NAMES.join('/')}）`)
      if (!title) return fail2(`第${line}行：标题为空`)

      // 作者昵称 → 账号；未知昵称归官方号
      const author = get('作者昵称')
      const user = author && db.users.find(u => u.nickname === author)
      const publisherId = user ? user.id : 'u_official'

      const pinned = ['是', 'y', 'yes', '1', 'true'].indexOf(get('置顶').toLowerCase()) > -1
      const tags = get('标签').split(/[;；、,，]/).map(t => t.trim()).filter(Boolean).slice(0, 8)

      // 封面：https / /uploads/… / 本地文件名（server/data/uploads/）
      const coverRes = resolveMediaRef(get('封面图URL'))
      if (!coverRes.ok) return fail2(`第${line}行：${coverRes.error}`)
      const cover = coverRes.url

      const rewritten = rewriteBodyMedia(bodyRaw)
      if (rewritten.errors.length) {
        return fail2(`第${line}行：正文图片 — ${rewritten.errors[0]}`)
      }

      const p = {
        id: store.uid('p'),
        cat: catKey,
        title,
        subtitle: get('副标题').slice(0, 60),
        body: rewritten.body.slice(0, 20000),
        images: cover ? [cover] : [],
        video: '',
        publisherId,
        city: (function () {
          const c = get('城市').slice(0, 20)
          if (c === '全国' || c === '不限') return '不限'
          return c || '北京'
        })(),
        pinned,
        noCover: false,
        tags,
        status: 'published',
        sort: sortCursor++,
        createdAt: Date.now() + idx,
        updatedAt: Date.now() + idx,
        stats: { views: 0, completes: 0, shares: 0 }
      }
      db.posts.unshift(p)
      result.success++
      result.createdIds.push(p.id)

      function fail2(msg) {
        result.failed++
        result.errors.push(msg)
      }
    })

    if (result.success) store.persist()
    ok(res, result)
  })
})

module.exports = router
