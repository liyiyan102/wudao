/**
 * 代发撮合（用户侧）
 * GET  /api/buddy/notices?uid=             审核结果消息
 * POST /api/buddy/notices/read-all
 * POST /api/buddy/notices/:id/read
 * POST /api/buddy/requests                 提交需求（私密）
 * GET  /api/buddy/requests?uid=            我的需求列表
 * GET  /api/buddy/requests/:id?uid=        需求详情（本人）
 * POST /api/buddy/requests/:id/withdraw    撤回 pending
 * POST /api/buddy/requests/:id/close       标记已结束
 * GET  /api/buddy/requests/:id/applications?uid=  加入列表（仅发起人，含联系方式）
 * POST /api/buddy/upload                   参考图（仅审核可见）
 */
const express = require('express')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const store = require('../store')
const { ok, fail } = require('../utils/resp')

const router = express.Router()
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const SUBS = store.BUDDY_SUBTYPES
const PENDING_MAX = 3

function requireUid(bodyOrQuery, res) {
  const uid = String((bodyOrQuery && (bodyOrQuery.uid || bodyOrQuery.UID)) || '')
  if (!uid) {
    fail(res, 4201, '缺少用户标识')
    return null
  }
  return uid
}

function publicRequest(r, db) {
  const act = r.linkedActivityId
    ? db.activities.find(a => a.id === r.linkedActivityId)
    : null
  const applicationCount = act
    ? (db.applications || []).filter(x => x.activityId === act.id).length
    : 0
  return {
    id: r.id,
    subType: r.subType,
    subTypeName: (SUBS[r.subType] || SUBS.practice).name,
    title: r.title,
    description: r.description,
    danceStyle: r.danceStyle,
    contestName: r.contestName || '',
    city: r.city,
    location: r.location,
    startDate: r.startDate || '',
    endDate: r.endDate || '',
    startTime: r.startTime || '',
    endTime: r.endTime || '',
    dateMode: r.dateMode || '',
    weekdays: Array.isArray(r.weekdays) ? r.weekdays : [],
    dateText: r.dateText,
    timeText: r.timeText,
    datetime: r.datetime,
    headcount: r.headcount,
    status: r.status,
    rejectReason: r.rejectReason || '',
    linkedActivityId: r.linkedActivityId || '',
    applicationCount,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt
  }
}

function publicNotice(n) {
  return {
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body || '',
    requestId: n.requestId || '',
    activityId: n.activityId || '',
    read: !!n.read,
    createdAt: n.createdAt
  }
}

function backfillNotices(db, uid) {
  db.notices = db.notices || []
  const have = {}
  db.notices.forEach(n => {
    if (n.uid === uid && n.requestId && n.kind) have[n.requestId + ':' + n.kind] = true
  })
  let added = false
  ;(db.buddyRequests || []).forEach(r => {
    if (r.uid !== uid) return
    if (r.status !== 'published' && r.status !== 'rejected') return
    const key = r.id + ':' + r.status
    if (have[key]) return
    if (r.status === 'published') {
      store.pushNotice(db, {
        uid,
        kind: 'published',
        title: '搭子需求已发布',
        body: r.title ? '「' + r.title + '」已上线，可在活动页查看' : '需求已通过审核并发布',
        requestId: r.id,
        activityId: r.linkedActivityId || '',
        createdAt: r.updatedAt || r.createdAt
      })
    } else {
      store.pushNotice(db, {
        uid,
        kind: 'rejected',
        title: '搭子需求未通过审核',
        body: r.rejectReason || '未通过审核',
        requestId: r.id,
        createdAt: r.updatedAt || r.createdAt
      })
    }
    added = true
  })
  return added
}

router.get('/notices', (req, res) => {
  const uid = requireUid(req.query, res)
  if (!uid) return
  const db = store.getDB()
  if (backfillNotices(db, uid)) store.persist()
  const items = (db.notices || [])
    .filter(n => n.uid === uid)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .map(publicNotice)
  ok(res, { items, unread: items.filter(x => !x.read).length })
})

router.post('/notices/read-all', (req, res) => {
  const uid = requireUid(req.body, res)
  if (!uid) return
  const db = store.getDB()
  ;(db.notices || []).forEach(n => {
    if (n.uid === uid) n.read = true
  })
  store.persist()
  ok(res, { ok: true })
})

router.post('/notices/:id/read', (req, res) => {
  const uid = requireUid(req.body, res)
  if (!uid) return
  const db = store.getDB()
  const n = (db.notices || []).find(x => x.id === req.params.id && x.uid === uid)
  if (!n) return fail(res, 4040, '消息不存在')
  n.read = true
  store.persist()
  ok(res, publicNotice(n))
})

router.post('/requests', (req, res) => {
  const b = req.body || {}
  const uid = requireUid(b, res)
  if (!uid) return

  const title = String(b.title || '').slice(0, 30).trim()
  const contactWechat = String(b.contactWechat || '').slice(0, 40).trim()
  if (!title) return fail(res, 4201, '请填写标题')
  if (!contactWechat) return fail(res, 4201, '请填写微信号')

  const db = store.getDB()
  db.buddyRequests = db.buddyRequests || []
  const pending = db.buddyRequests.filter(r => r.uid === uid && r.status === 'pending')
  if (pending.length >= PENDING_MAX) return fail(res, 4109, '审核中的需求最多 3 条，请等审核完成')

  const subType = SUBS[b.subType] ? b.subType : 'practice'
  const { composeActivitySchedule, normalizeTimeValue } = require('../utils/dates')
  const startTime = normalizeTimeValue(b.startTime)
  const endTime = normalizeTimeValue(b.endTime)
  const dateMode = String(b.dateMode || '')
  const weekdays = Array.isArray(b.weekdays) ? b.weekdays : []
  let startDate = String(b.startDate || '').slice(0, 10)
  let endDate = String(b.endDate || '').slice(0, 10)
  const sched = composeActivitySchedule({
    dateMode, weekdays, startDate, endDate, startTime, endTime, dateText: b.dateText
  })
  if (sched.dateMode !== 'once') {
    startDate = ''
    endDate = ''
  }
  const rec = {
    id: store.uid('br'),
    uid,
    subType,
    title,
    description: String(b.description || '').slice(0, 500),
    danceStyle: String(b.danceStyle || '').slice(0, 30),
    contestName: String(b.contestName || '').slice(0, 40),
    city: String(b.city || '').slice(0, 20),
    location: String(b.location || '').slice(0, 60),
    lat: Number(b.lat) || 0,
    lng: Number(b.lng) || 0,
    startDate,
    endDate,
    startTime,
    endTime,
    dateMode: sched.dateMode,
    weekdays: sched.weekdays,
    dateText: sched.dateText,
    timeText: sched.timeText || String(b.timeText || '').slice(0, 40),
    datetime: Number(b.datetime) || 0,
    headcount: String(b.headcount || '不限').slice(0, 10),
    contactWechat,
    contactPhone: String(b.contactPhone || '').slice(0, 20),
    refImages: Array.isArray(b.refImages) ? b.refImages.slice(0, 3) : [],
    status: 'pending',
    rejectReason: '',
    linkedActivityId: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  db.buddyRequests.unshift(rec)
  store.persist()
  ok(res, publicRequest(rec, db))
})

router.get('/requests', (req, res) => {
  const uid = requireUid(req.query, res)
  if (!uid) return
  const db = store.getDB()
  const list = (db.buddyRequests || [])
    .filter(r => r.uid === uid)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(r => publicRequest(r, db))
  ok(res, { items: list })
})

router.get('/requests/:id', (req, res) => {
  const uid = requireUid(req.query, res)
  if (!uid) return
  const db = store.getDB()
  const r = (db.buddyRequests || []).find(x => x.id === req.params.id)
  if (!r || r.uid !== uid) return fail(res, 4040, '需求不存在')
  ok(res, publicRequest(r, db))
})

router.post('/requests/:id/withdraw', (req, res) => {
  const uid = requireUid(req.body, res)
  if (!uid) return
  const db = store.getDB()
  const i = (db.buddyRequests || []).findIndex(x => x.id === req.params.id && x.uid === uid)
  if (i === -1) return fail(res, 4040, '需求不存在')
  const r = db.buddyRequests[i]
  if (r.status !== 'pending') return fail(res, 4107, '仅审核中的需求可撤回')
  db.buddyRequests.splice(i, 1)
  store.persist()
  ok(res, { withdrawn: true })
})

router.post('/requests/:id/close', (req, res) => {
  const uid = requireUid(req.body, res)
  if (!uid) return
  const db = store.getDB()
  const r = (db.buddyRequests || []).find(x => x.id === req.params.id && x.uid === uid)
  if (!r) return fail(res, 4040, '需求不存在')
  if (r.status !== 'published') return fail(res, 4107, '仅已发布的练舞局可结束')
  r.status = 'closed'
  r.updatedAt = Date.now()
  const act = db.activities.find(a => a.id === r.linkedActivityId)
  if (act) act.buddyStatus = 'ended'
  store.persist()
  ok(res, { closed: true })
})

router.get('/requests/:id/applications', (req, res) => {
  const uid = requireUid(req.query, res)
  if (!uid) return
  const db = store.getDB()
  const r = (db.buddyRequests || []).find(x => x.id === req.params.id)
  if (!r || r.uid !== uid) return fail(res, 403, '无权查看')
  const activityId = r.linkedActivityId
  const items = (db.applications || [])
    .filter(a => a.requestId === r.id || (activityId && a.activityId === activityId))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(a => ({
      id: a.id,
      message: a.message,
      contactWechat: a.contactWechat,
      contactPhone: a.contactPhone || '',
      createdAt: a.createdAt
    }))
  ok(res, { items, title: r.title })
})

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase()
      cb(null, Date.now().toString(36) + '-' + crypto.randomUUID().slice(0, 8) + ext)
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].indexOf(ext) === -1) return cb(new Error('BAD_EXT'))
    cb(null, true)
  }
}).single('file')

router.post('/upload', (req, res) => {
  upload(req, res, err => {
    if (err) {
      if (err.message === 'BAD_EXT') return fail(res, 4201, '图片类型不支持')
      if (err.code === 'LIMIT_FILE_SIZE') return fail(res, 4201, '图片超过 10MB')
      return fail(res, 500, '上传失败')
    }
    if (!req.file) return fail(res, 4201, '缺少文件')
    ok(res, { url: '/uploads/' + req.file.filename, kind: 'image' })
  })
})

module.exports = router
