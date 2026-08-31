/**
 * PGC 后台 API（口令登录 + JWT）
 * POST /api/admin/login            口令登录
 * GET  /api/admin/posts            内容列表（含草稿；?cat=&status=&q=）
 * GET  /api/admin/posts/:id        内容详情（编辑回填）
 * POST /api/admin/posts            新建（body: {..., action: 'draft'|'publish'}）
 * PUT  /api/admin/posts/:id        更新（编辑后即可发布：action 可改状态）
 * DELETE /api/admin/posts/:id      删除
 * POST /api/admin/posts/:id/pin    置顶切换
 * GET/POST/PUT/DELETE /api/admin/activities[/:id]  活动 CRUD
 * POST /api/admin/activities/:id/pin  活动置顶
 * GET  /api/admin/stats            数据看板
 * GET  /api/admin/users            运营账号（署名下拉）
 */
const express = require('express')
const jwt = require('jsonwebtoken')
const config = require('../config')
const store = require('../store')
const { ok, fail } = require('../utils/resp')

const router = express.Router()

/** JWT 鉴权 */
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  try {
    const payload = jwt.verify(token, config.JWT_SECRET)
    if (payload.role !== 'admin') throw new Error()
    req.user = payload
    next()
  } catch (e) {
    fail(res, 401, '请先登录', 401)
  }
}

router.post('/login', (req, res) => {
  const { password } = req.body || {}
  if (!password || password !== config.ADMIN_PASSWORD) {
    return fail(res, 403, '口令错误')
  }
  const token = jwt.sign({ role: 'admin' }, config.JWT_SECRET, { expiresIn: 12 * 3600 })
  ok(res, { token })
})

/* ================= 内容 CRUD ================= */

router.get('/posts', auth, (req, res) => {
  const db = store.getDB()
  const { cat, status, q } = req.query
  let list = db.posts.slice()
  if (cat) list = list.filter(p => p.cat === cat)
  if (status) list = list.filter(p => p.status === status)
  if (q) list = list.filter(p => p.title.toLowerCase().indexOf(String(q).toLowerCase()) > -1)
  const rank = require('../utils/rank-posts')
  list = rank.sortAdminPosts(list)
  ok(res, list.map(p => Object.assign({}, p, {
    catName: (store.CATS[p.cat] || {}).name || '其他',
    publisherName: publisherOfName(p.publisherId)
  })))
})

router.get('/posts/:id', auth, (req, res) => {
  const p = store.getDB().posts.find(x => x.id === req.params.id)
  if (!p) return fail(res, 4040, '内容不存在')
  ok(res, p)
})

function normalizePost(body, existing) {
  const b = body || {}
  return {
    cat: store.CATS[b.cat] ? b.cat : (existing ? existing.cat : 'culture'),
    title: String(b.title || '').slice(0, 40).trim(),
    subtitle: String(b.subtitle || '').slice(0, 60).trim(),
    body: String(b.body || '').slice(0, 20000),
    images: Array.isArray(b.images) ? b.images.slice(0, 9) : [],
    video: '',
    publisherId: b.publisherId || (existing ? existing.publisherId : 'u_official'),
    city: (function () {
      const c = String(b.city || '').trim().slice(0, 20)
      if (c === '全国') return '不限'
      return c || '北京'
    })(),
    pinned: !!b.pinned,
    noCover: false,
    tags: Array.isArray(b.tags) ? b.tags.slice(0, 8) : []
  }
}

router.post('/posts', auth, (req, res) => {
  const db = store.getDB()
  const action = req.body.action === 'draft' ? 'draft' : 'publish'
  const p = Object.assign(normalizePost(req.body), {
    id: store.uid('p'),
    status: action === 'draft' ? 'draft' : 'published',
    sort: store.nextSort(db.posts),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    stats: { views: 0, completes: 0, shares: 0 }
  })
  if (!p.title) return fail(res, 4201, '标题必填')
  if (p.pinned) {
    const rank = require('../utils/rank-posts')
    rank.assignPinSort(db.posts, p)
  }
  db.posts.unshift(p)
  store.persist()
  ok(res, p)
})

/** 拖动排序：仅置顶帖；body { ids: [置顶区展示顺序…] } */
router.post('/posts/reorder', auth, (req, res) => {
  const ids = (req.body && req.body.ids) || []
  if (!ids.length) return fail(res, 4201, '缺少 ids')
  const db = store.getDB()
  const rank = require('../utils/rank-posts')
  const count = rank.applyPinnedReorder(db.posts, ids)
  store.persist()
  ok(res, { count })
})

router.put('/posts/:id', auth, (req, res) => {
  const db = store.getDB()
  const p = db.posts.find(x => x.id === req.params.id)
  if (!p) return fail(res, 4040, '内容不存在')
  // 编辑后即可发布：action=publish → 立即上线；action=draft → 存草稿；缺省保持原状态
  const action = req.body.action
  const wasPinned = !!p.pinned
  Object.assign(p, normalizePost(req.body, p), { updatedAt: Date.now() })
  if (action === 'publish') p.status = 'published'
  else if (action === 'draft') p.status = 'draft'
  if (!p.title) return fail(res, 4201, '标题必填')
  if (p.pinned && !wasPinned) {
    const rank = require('../utils/rank-posts')
    rank.assignPinSort(db.posts, p)
  }
  store.persist()
  ok(res, p)
})

router.delete('/posts/:id', auth, (req, res) => {
  const db = store.getDB()
  const i = db.posts.findIndex(x => x.id === req.params.id)
  if (i === -1) return fail(res, 4040, '内容不存在')
  db.posts.splice(i, 1)
  store.persist()
  ok(res, null)
})

/** 批量删除内容：body { ids: [id…] } → { deleted, missing } */
router.post('/posts/batch-delete', auth, (req, res) => {
  const ids = (req.body && req.body.ids) || []
  if (!ids.length) return fail(res, 4201, '缺少 ids')
  const db = store.getDB()
  let deleted = 0
  ids.forEach(id => {
    const i = db.posts.findIndex(x => x.id === id)
    if (i > -1) { db.posts.splice(i, 1); deleted++ }
  })
  store.persist()
  ok(res, { deleted, missing: ids.length - deleted })
})

router.post('/posts/:id/pin', auth, (req, res) => {
  const db = store.getDB()
  const p = db.posts.find(x => x.id === req.params.id)
  if (!p) return fail(res, 4040, '内容不存在')
  const next = (req.body && req.body.pinned !== undefined) ? !!req.body.pinned : !p.pinned
  const rank = require('../utils/rank-posts')
  if (next && !p.pinned) {
    p.pinned = true
    rank.assignPinSort(db.posts, p)
  } else if (!next && p.pinned) {
    p.pinned = false
  } else {
    p.pinned = next
  }
  store.persist()
  ok(res, { pinned: p.pinned })
})

/** 下线/上线切换：published ↔ offline（列表保留，小程序不可见） */
router.post('/posts/:id/offline', auth, (req, res) => {
  const db = store.getDB()
  const p = db.posts.find(x => x.id === req.params.id)
  if (!p) return fail(res, 4040, '内容不存在')
  const to = p.status === 'offline' ? 'published' : 'offline'
  // 下线同时取消置顶（避免幽灵置顶）
  if (to === 'offline' && p.pinned) p.pinned = false
  p.status = to
  p.updatedAt = Date.now()
  store.persist()
  ok(res, { status: to })
})

/* ================= 活动 CRUD ================= */

router.get('/activities', auth, (req, res) => {
  const db = store.getDB()
  let list = db.activities.slice()
  if (req.query.type) list = list.filter(a => a.type === req.query.type)
  list.sort(store.cmpSort)
  ok(res, list.map(a => {
    const sub = a.type === 'buddy' ? store.BUDDY_SUBTYPES[a.buddySubType] : null
    return Object.assign({}, a, {
      typeName: sub ? sub.badge : ((store.ACT_TYPES[a.type] || {}).name || '其他'),
      applicationCount: a.type === 'buddy'
        ? (store.getDB().applications || []).filter(x => x.activityId === a.id).length
        : undefined
    })
  }))
})

router.get('/activities/:id', auth, (req, res) => {
  const a = store.getDB().activities.find(x => x.id === req.params.id)
  if (!a) return fail(res, 4040, '活动不存在')
  ok(res, a)
})

function normalizeActivity(b, existing) {
  b = b || {}
  const { composeActivitySchedule, normalizeTimeValue } = require('../utils/dates')
  const type = store.ACT_TYPES[b.type] ? b.type : (existing ? existing.type : 'official')
  const startTime = normalizeTimeValue(
    b.startTime != null ? b.startTime : (existing && existing.startTime) || ''
  )
  const endTime = normalizeTimeValue(
    b.endTime != null ? b.endTime : (existing && existing.endTime) || ''
  )
  let dateMode = String(b.dateMode != null ? b.dateMode : (existing && existing.dateMode) || '')
  let weekdays = Array.isArray(b.weekdays) ? b.weekdays : ((existing && existing.weekdays) || [])
  let startDate = String(b.startDate != null ? b.startDate : (existing && existing.startDate) || '').slice(0, 10)
  let endDate = String(b.endDate != null ? b.endDate : (existing && existing.endDate) || '').slice(0, 10)
  if (dateMode !== 'none' && dateMode !== 'weekly' && dateMode !== 'once') {
    dateMode = ''
  }
  const sched = composeActivitySchedule({
    dateMode, weekdays, startDate, endDate, startTime, endTime,
    dateText: b.dateText || (existing && existing.dateText) || ''
  })
  dateMode = sched.dateMode
  weekdays = sched.weekdays
  if (dateMode !== 'once') {
    startDate = ''
    endDate = ''
  }

  const out = {
    type,
    title: String(b.title || '').slice(0, 40).trim(),
    shortTitle: String(b.shortTitle != null ? b.shortTitle : (existing ? existing.shortTitle : '') || '').slice(0, 12).trim(),
    desc: String(b.desc || '').slice(0, 300),
    city: String(b.city || (existing ? existing.city : '') || '北京').slice(0, 20),
    location: String(b.location || '').slice(0, 60),
    lat: Number(b.lat) || (existing && existing.lat) || 39.96,
    lng: Number(b.lng) || (existing && existing.lng) || 116.4,
    startDate,
    endDate,
    startTime,
    endTime,
    dateMode,
    weekdays,
    dateText: sched.dateText,
    timeText: sched.timeText,
    danceTypes: String(b.danceTypes || '').slice(0, 60),
    contestName: String(b.contestName || (existing && existing.contestName) || '').slice(0, 40),
    coverUrl: String(b.coverUrl != null ? b.coverUrl : (existing && existing.coverUrl) || '').slice(0, 500),
    organizer: String(b.organizer || '').slice(0, 30),
    followCount: b.followCount !== undefined && b.followCount !== ''
      ? (Number(b.followCount) || 0)
      : (existing ? (existing.followCount || 0) : 0),
    headcount: String(b.headcount != null ? b.headcount : (existing ? existing.headcount : '') || '不限').slice(0, 10),
    schedule: Array.isArray(b.schedule)
      ? b.schedule.filter(s => s.time || s.item).slice(0, 12).map(s => ({
        time: String(s.time || '').slice(0, 10),
        item: String(s.item || '').slice(0, 40)
      }))
      : (existing ? (existing.schedule || []) : []),
    notes: String(b.notes || '').slice(0, 500),
    pinned: b.pinned !== undefined ? !!b.pinned : (existing ? !!existing.pinned : false)
  }
  if (type === 'buddy') {
    const sub = b.buddySubType || (existing && existing.buddySubType) || 'practice'
    out.buddySubType = store.BUDDY_SUBTYPES[sub] ? sub : 'practice'
    out.buddyStatus = (existing && existing.buddyStatus) || 'recruiting'
    if (!out.notes && !(existing && existing.notes)) {
      out.notes = store.BUDDY_DEFAULT_NOTES
    }
  }
  return out
}

router.post('/activities', auth, (req, res) => {
  const db = store.getDB()
  const action = req.body.action === 'draft' ? 'draft' : 'publish'
  const a = Object.assign(normalizeActivity(req.body), {
    id: store.uid('a'),
    status: action === 'draft' ? 'draft' : 'published',
    sort: store.nextSort(db.activities),
    createdAt: Date.now()
  })
  if (!a.title) return fail(res, 4201, '活动标题必填')
  db.activities.unshift(a)
  store.persist()
  ok(res, a)
})

/** 活动拖动排序：body { ids: […] } */
router.post('/activities/reorder', auth, (req, res) => {
  const ids = (req.body && req.body.ids) || []
  if (!ids.length) return fail(res, 4201, '缺少 ids')
  const db = store.getDB()
  store.applyReorder(db.activities, ids)
  store.persist()
  ok(res, { count: ids.length })
})

router.put('/activities/:id', auth, (req, res) => {
  const db = store.getDB()
  const a = db.activities.find(x => x.id === req.params.id)
  if (!a) return fail(res, 4040, '活动不存在')
  Object.assign(a, normalizeActivity(req.body, a))
  if (req.body.action === 'publish') a.status = 'published'
  else if (req.body.action === 'draft') a.status = 'draft'
  if (!a.title) return fail(res, 4201, '活动标题必填')
  store.persist()
  ok(res, a)
})

/** 活动置顶切换（小程序活动列表顶部） */
router.post('/activities/:id/pin', auth, (req, res) => {
  const db = store.getDB()
  const a = db.activities.find(x => x.id === req.params.id)
  if (!a) return fail(res, 4040, '活动不存在')
  if (req.body && req.body.pinned !== undefined) a.pinned = !!req.body.pinned
  else a.pinned = !a.pinned
  store.persist()
  ok(res, { pinned: a.pinned })
})

router.delete('/activities/:id', auth, (req, res) => {
  const db = store.getDB()
  const i = db.activities.findIndex(x => x.id === req.params.id)
  if (i === -1) return fail(res, 4040, '活动不存在')
  db.activities.splice(i, 1)
  store.persist()
  ok(res, null)
})

/** 批量删除活动 */
router.post('/activities/batch-delete', auth, (req, res) => {
  const ids = (req.body && req.body.ids) || []
  if (!ids.length) return fail(res, 4201, '缺少 ids')
  const db = store.getDB()
  let deleted = 0
  ids.forEach(id => {
    const i = db.activities.findIndex(x => x.id === id)
    if (i > -1) { db.activities.splice(i, 1); deleted++ }
  })
  store.persist()
  ok(res, { deleted, missing: ids.length - deleted })
})

/** 活动下线/上线切换 */
router.post('/activities/:id/offline', auth, (req, res) => {
  const db = store.getDB()
  const a = db.activities.find(x => x.id === req.params.id)
  if (!a) return fail(res, 4040, '活动不存在')
  const to = a.status === 'offline' ? 'published' : 'offline'
  if (to === 'offline' && a.pinned) a.pinned = false
  a.status = to
  store.persist()
  ok(res, { status: to })
})

/* ================= 看板 & 账号 ================= */

router.get('/stats', auth, (req, res) => {
  const db = store.getDB()
  const pub = db.posts.filter(p => p.status === 'published')
  const views = pub.reduce((s, p) => s + ((p.stats && p.stats.views) || 0), 0)
  const completes = pub.reduce((s, p) => s + ((p.stats && p.stats.completes) || 0), 0)
  const shares = pub.reduce((s, p) => s + ((p.stats && p.stats.shares) || 0), 0)
  ok(res, {
    publishedCount: pub.length,
    draftCount: db.posts.filter(p => p.status === 'draft').length,
    offlineCount: db.posts.filter(p => p.status === 'offline').length,
    activityCount: db.activities.filter(a => a.status === 'published').length,
    views, shares,
    completionRate: views ? Math.round(completes / views * 100) + '%' : '0%'
  })
})

router.get('/users', auth, (req, res) => {
  ok(res, store.getDB().users.map(u => ({
    id: u.id,
    nickname: u.nickname,
    column: u.column || '',
    columnName: u.columnName || ''
  })))
})

/* ================= 搭子需求审核与代发 ================= */

function enrichAdminRequest(r, db) {
  const sub = store.BUDDY_SUBTYPES[r.subType] || store.BUDDY_SUBTYPES.practice
  const act = r.linkedActivityId
    ? db.activities.find(a => a.id === r.linkedActivityId)
    : null
  const applicationCount = act
    ? (db.applications || []).filter(x => x.activityId === act.id).length
    : 0
  return Object.assign({}, r, {
    subTypeName: sub.name,
    applicationCount,
    linkedActivityTitle: act ? act.title : ''
  })
}

router.get('/buddy-requests', auth, (req, res) => {
  const db = store.getDB()
  const { status } = req.query
  let list = (db.buddyRequests || []).slice()
  if (status) list = list.filter(r => r.status === status)
  const rank = { pending: 0, published: 1, rejected: 2, closed: 3 }
  list.sort((a, b) => (rank[a.status] - rank[b.status]) || (b.createdAt - a.createdAt))
  ok(res, list.map(r => enrichAdminRequest(r, db)))
})

router.get('/buddy-stats', auth, (req, res) => {
  const db = store.getDB()
  const reqs = db.buddyRequests || []
  const pending = reqs.filter(r => r.status === 'pending').length
  const submitted = reqs.length
  const approved = reqs.filter(r => r.status === 'published' || r.status === 'closed').length
  const buddies = db.activities.filter(a => a.type === 'buddy' && a.status === 'published')
  const apps = db.applications || []
  const avgApply = buddies.length
    ? Math.round(apps.filter(x => buddies.some(a => a.id === x.activityId)).length / buddies.length * 10) / 10
    : 0
  ok(res, {
    pending,
    passRate: submitted ? Math.round(approved / submitted * 100) + '%' : '—',
    publishedBuddy: buddies.length,
    avgApply
  })
})

router.get('/buddy-requests/:id', auth, (req, res) => {
  const db = store.getDB()
  const r = (db.buddyRequests || []).find(x => x.id === req.params.id)
  if (!r) return fail(res, 4040, '需求不存在')
  ok(res, enrichAdminRequest(r, db))
})

router.post('/buddy-requests/:id/reject', auth, (req, res) => {
  const db = store.getDB()
  const r = (db.buddyRequests || []).find(x => x.id === req.params.id)
  if (!r) return fail(res, 4040, '需求不存在')
  if (r.status !== 'pending') return fail(res, 4107, '仅待审核需求可驳回')
  r.status = 'rejected'
  r.rejectReason = String((req.body || {}).reason || '未通过审核').slice(0, 200)
  r.updatedAt = Date.now()
  store.pushNotice(db, {
    uid: r.uid,
    kind: 'rejected',
    title: '搭子需求未通过审核',
    body: r.rejectReason,
    requestId: r.id,
    createdAt: r.updatedAt
  })
  store.persist()
  ok(res, r)
})

router.post('/buddy-requests/:id/publish', auth, (req, res) => {
  const db = store.getDB()
  const r = (db.buddyRequests || []).find(x => x.id === req.params.id)
  if (!r) return fail(res, 4040, '需求不存在')
  if (r.status !== 'pending' && r.status !== 'approved') return fail(res, 4107, '当前状态不可代发')
  const b = req.body || {}
  const title = String(b.title || r.title).slice(0, 40).trim()
  if (!title) return fail(res, 4201, '活动标题必填')
  const subType = store.BUDDY_SUBTYPES[b.buddySubType] ? b.buddySubType : r.subType
  const notes = String(b.notes || store.BUDDY_DEFAULT_NOTES).slice(0, 500)
  const desc = String(b.desc || r.description || '').slice(0, 300)
  if (/加微|加\s*v|微信[:：]|wechat/i.test(desc + notes + title)) {
    return fail(res, 4201, '正文不能包含联系方式或「加微信」引流')
  }
  const { composeActivitySchedule, normalizeTimeValue } = require('../utils/dates')
  const startTime = normalizeTimeValue(b.startTime != null ? b.startTime : (r.startTime || ''))
  const endTime = normalizeTimeValue(b.endTime != null ? b.endTime : (r.endTime || ''))
  const dateMode = String(b.dateMode != null ? b.dateMode : (r.dateMode || ''))
  const weekdays = Array.isArray(b.weekdays) ? b.weekdays : (r.weekdays || [])
  let startDate = String(b.startDate != null ? b.startDate : (r.startDate || '')).slice(0, 10)
  let endDate = String(b.endDate != null ? b.endDate : (r.endDate || '')).slice(0, 10)
  const sched = composeActivitySchedule({
    dateMode, weekdays, startDate, endDate, startTime, endTime, dateText: r.dateText
  })
  if (sched.dateMode !== 'once') {
    startDate = ''
    endDate = ''
  }
  const act = {
    id: store.uid('a'),
    type: 'buddy',
    buddySubType: subType,
    buddyStatus: 'recruiting',
    sourceRequestId: r.id,
    initiatorUid: r.uid,
    title,
    shortTitle: String(b.shortTitle || title).slice(0, 12),
    desc,
    city: String(b.city || r.city || '北京').slice(0, 20),
    location: String(b.location || r.location).slice(0, 60),
    lat: Number(b.lat) || r.lat || 39.96,
    lng: Number(b.lng) || r.lng || 116.4,
    startDate,
    endDate,
    startTime,
    endTime,
    dateMode: sched.dateMode,
    weekdays: sched.weekdays,
    dateText: sched.dateText,
    timeText: sched.timeText,
    danceTypes: String(b.danceTypes || r.danceStyle || '').slice(0, 60),
    contestName: String(b.contestName != null ? b.contestName : (r.contestName || '')).slice(0, 40),
    organizer: '舞岛官方',
    followCount: 0,
    headcount: String(b.headcount || r.headcount || '不限').slice(0, 10),
    schedule: [],
    notes,
    status: 'published',
    sort: store.nextSort(db.activities),
    createdAt: Date.now()
  }
  db.activities.unshift(act)
  r.status = 'published'
  r.linkedActivityId = act.id
  r.updatedAt = Date.now()
  store.pushNotice(db, {
    uid: r.uid,
    kind: 'published',
    title: '搭子需求已发布',
    body: '「' + act.title + '」已上线，可在活动页查看',
    requestId: r.id,
    activityId: act.id,
    createdAt: r.updatedAt
  })
  store.persist()
  ok(res, act)
})

router.post('/activities/:id/end-buddy', auth, (req, res) => {
  const db = store.getDB()
  const a = db.activities.find(x => x.id === req.params.id)
  if (!a || a.type !== 'buddy') return fail(res, 4040, '练舞局不存在')
  a.buddyStatus = 'ended'
  const r = (db.buddyRequests || []).find(x => x.linkedActivityId === a.id)
  if (r) { r.status = 'closed'; r.updatedAt = Date.now() }
  store.persist()
  ok(res, { ended: true })
})

function publisherOfName(id) {
  const u = store.getDB().users.find(x => x.id === id)
  return u ? u.nickname : '—'
}

module.exports = router
