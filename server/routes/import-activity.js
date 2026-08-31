/**
 * 活动批量导入（admin 鉴权）
 * POST /api/admin/import/activity  multipart: file=.xlsx/.csv
 *   列：活动类型 | 标题 | 短标题 | 日期 | 时间 | 地点 | 城市 | 舞种 | 主办方 | 描述 | 注意事项 | 日程(14:00 签到;15:00 海选)
 * GET  /api/admin/import/activity-template.xlsx
 */
const express = require('express')
const multer = require('multer')
const XLSX = require('xlsx')
const ExcelJS = require('exceljs')
const jwt = require('jsonwebtoken')
const config = require('../config')
const store = require('../store')
const { ok, fail } = require('../utils/resp')
const { resolveMediaRef, ensureDirs } = require('../utils/import-media')

const router = express.Router()
ensureDirs()

const COLS = ['活动类型', '标题', '短标题', '日期', '时间', '地点', '城市', '舞种', '主办方', '描述', '注意事项', '日程', '封面图URL']
const ACT_KEYS = Object.keys(store.ACT_TYPES) // buddy/official/contest/master/other
const ACT_NAMES = ACT_KEYS.map(k => store.ACT_TYPES[k].name)
const TYPE_ALIASES = {
  '找搭子': 'buddy', '搭子': 'buddy', '练舞局': 'buddy',
  '官方': 'official', '官方活动': 'official', '官方发起': 'official',
  '赛事': 'contest', '比赛': 'contest',
  '大师课': 'master', '课程': 'master', '工作坊': 'master', 'workshop': 'master',
  '其他': 'other', 'other': 'other',
  'jam': 'other', 'Jam': 'other', '即兴': 'other', 'cypher': 'other'
}

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.query.token
  try {
    const payload = jwt.verify(token, config.JWT_SECRET)
    if (payload.role !== 'admin') throw new Error()
    next()
  } catch (e) {
    fail(res, 401, '请先登录', 401)
  }
}

/* ---------------- 模板下载 ---------------- */

router.get('/activity-template.xlsx', auth, async (req, res) => {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('活动导入')

  const header = ws.addRow(COLS)
  header.eachCell(c => {
    c.font = { bold: true, color: { argb: 'FF3C3489' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEDFE' } }
  })
  ;[14, 32, 14, 12, 20, 26, 8, 22, 16, 46, 40, 50, 34].forEach((w, i) => ws.getColumn(i + 1).width = w)

  ws.addRow(['官方活动', '舞岛官方 · 新人欢迎 Cypher', '新人 Cypher', '9月1日', '19:00 - 21:00', '国贸 CBD 文化广场', '北京', '全舞种 · 零基础友好', '舞岛官方', '舞岛官方活动的线下新人局：教练带练 + 自由 Cypher。', '完全免费；现场有舞岛周边小礼品。', '19:00 签到·分组破冰;19:30 教练带练基础律动;20:10 自由 Cypher;20:50 合影·自由交流', '']).alignment = { wrapText: true, vertical: 'top' }
  ws.addRow(['赛事', 'KOD 世界总决赛中国区预选', 'KOD 预选', '8月24日', '14:00 - 22:00', '北京 工人体育馆', '北京', 'Breaking · Hip-hop · Locking · Popping', 'KOD 中国区组委会', '中国街舞最高级别赛事海选，优胜者直通世界总决赛。', '参赛提前 1 小时签到；观赛免预约。', '14:00 签到入场;15:00 Breaking 1v1 海选;17:00 Hip-hop 海选;21:00 决赛·颁奖', 'https://example.com/kod.jpg']).alignment = { wrapText: true, vertical: 'top' }
  ws.addRow(['大师课', 'Kilo 大师课 · Hip-hop 律动专修', 'Kilo 大师课', '9月2日', '14:00 开场 · 4 课时', '北京 望京 SOHO', '北京', 'Hip-hop', 'Kilo Studio', '从 isolation 到律动节奏，4 课时拆解核心律动。', '适合练舞 1 年以上；穿软底鞋。', '14:00 isolation 基础;15:30 律动节奏;17:00 编排实战;18:30 分组展示', 'cover.jpg']).alignment = { wrapText: true, vertical: 'top' }

  // A 列活动类型下拉
  const dvType = {
    type: 'list', allowBlank: true,
    formulae: [`"${ACT_NAMES.join(',')}"`],
    showErrorMessage: true, errorTitle: '类型不合法',
    error: `请从下拉选择：${ACT_NAMES.join(' / ')}`
  }
  // G 列城市下拉
  const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安']
  const dvCity = {
    type: 'list', allowBlank: true,
    formulae: [`"${CITIES.join(',')}"`],
    showErrorMessage: true, errorTitle: '城市不合法', error: '请从下拉选择城市'
  }
  for (let row = 2; row <= 300; row++) {
    ws.getCell('A' + row).dataValidation = Object.assign({}, dvType)
    ws.getCell('G' + row).dataValidation = Object.assign({}, dvCity)
  }

  const note = wb.addWorksheet('封面图')
  note.columns = [
    { header: '说明', key: 'a', width: 22 },
    { header: '写法', key: 'b', width: 48 }
  ]
  note.getRow(1).eachCell(c => {
    c.font = { bold: true, color: { argb: 'FF3C3489' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEDFE' } }
  })
  ;[
    ['文件放哪', 'server/data/uploads/（后台上传和批量导入同一目录）'],
    ['封面列填法', '只填文件名，如 cover.jpg；或 https://… / /uploads/…'],
    ['线上导入', '把文件放到服务器 /opt/wudao/data/uploads/']
  ].forEach(r => note.addRow(r))

  const buf = await wb.xlsx.writeBuffer()
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=wudao-activity-template.xlsx')
  res.send(Buffer.from(buf))
})

/* ---------------- 批量导入 ---------------- */

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }).single('file')

router.post('/activity', auth, (req, res) => {
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

    const header = rows[0].map(c => String(c).trim())
    const colIdx = {}
    COLS.forEach((c, i) => { colIdx[c] = header.indexOf(c) === -1 ? i : header.indexOf(c) })

    const db = store.getDB()
    const result = { total: 0, success: 0, failed: 0, errors: [], createdIds: [] }
    let sortCursor = store.nextSort(db.activities)

    rows.slice(1).forEach((r, idx) => {
      const line = idx + 2
      const get = name => {
        const i = colIdx[name]
        return i > -1 && r[i] !== undefined ? String(r[i]).trim() : ''
      }
      const typeName = get('活动类型')
      const title = get('标题').slice(0, 40)
      const location = get('地点')
      const dateText = get('日期')

      result.total++
      if (!typeName) return fail2(`第${line}行：活动类型为空`)
      const typeKey = ACT_KEYS.find(k => store.ACT_TYPES[k].name === typeName || k === typeName.toLowerCase())
        || TYPE_ALIASES[typeName.toLowerCase()]
      if (!typeKey) return fail2(`第${line}行：类型「${typeName}」不合法（${ACT_NAMES.join('/')}）`)
      if (!title) return fail2(`第${line}行：标题为空`)
      if (!location) return fail2(`第${line}行：地点为空`)
      if (!dateText) return fail2(`第${line}行：日期为空`)

      const coverRes = resolveMediaRef(get('封面图URL'))
      if (!coverRes.ok) return fail2(`第${line}行：${coverRes.error}`)

      // 日程："14:00 签到;15:00 海选" → [{time, item}]
      const schedule = get('日程').split(/[;；\n]/).map(s => s.trim()).filter(Boolean).slice(0, 12).map(s => {
        const m = s.match(/^(\d{1,2}:\d{2})\s*[\s·\-—]?\s*(.*)$/)
        return m ? { time: m[1], item: (m[2] || '').slice(0, 40) } : { time: '', item: s.slice(0, 40) }
      }).filter(s => s.time || s.item)

      // 坐标：未提供用城市中心（北京 39.96,116.4），其他城市给近似中心
      const CITY_CENTER = {
        '北京': [39.96, 116.4], '上海': [31.23, 121.47], '广州': [23.13, 113.26],
        '深圳': [22.54, 114.06], '杭州': [30.27, 120.16], '成都': [30.57, 104.07],
        '武汉': [30.59, 114.31], '西安': [34.34, 108.94]
      }
      const city = get('城市') || '北京'
      const center = CITY_CENTER[city] || CITY_CENTER['北京']

      const a = {
        id: store.uid('a'),
        type: typeKey,
        title,
        shortTitle: get('短标题').slice(0, 12) || title.slice(0, 8),
        desc: get('描述').slice(0, 300),
        coverUrl: coverRes.url || '',
        city,
        location: location.slice(0, 60),
        lat: center[0] + (Math.random() - 0.5) * 0.08, // 城市中心附近偏移（无地图 API 时的近似坐标）
        lng: center[1] + (Math.random() - 0.5) * 0.08,
        dateText: dateText.slice(0, 20),
        timeText: get('时间').slice(0, 30),
        danceTypes: get('舞种').slice(0, 60),
        organizer: get('主办方').slice(0, 30),
        followCount: 0,
        joinCount: typeKey === 'official' ? 0 : 0,
        checkinCount: 0,
        schedule,
        notes: get('注意事项').slice(0, 500),
        pinned: false,
        status: 'published',
        sort: sortCursor++,
        createdAt: Date.now() + idx
      }
      db.activities.unshift(a)
      result.success++
      result.createdIds.push(a.id)

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
