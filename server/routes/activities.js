/**
 * 活动 API
 * GET  /api/activities?type=            列表
 * GET  /api/activities/joined?uid=      我加入的（在 :id 路由前声明）
 * GET  /api/activities/:id?uid=         详情（含 joined/checkedIn 状态）
 * POST /api/activities/:id/join         加入官方活动（幂等）
 * POST /api/activities/:id/checkin      现场打卡（须已加入，一次）
 */
const express = require('express')
const store = require('../store')
const { ok, fail } = require('../utils/resp')
const { enrichActivity } = require('../utils/enrich')
const { absUpload } = require('../utils/public-url')

const router = express.Router()

function absCover(req, a) {
  if (!a || !a.coverUrl) return a
  a.coverUrl = absUpload(req, a.coverUrl)
  return a
}

function findActivity(id) {
  return store.getDB().activities.find(a => a.id === id && a.status === 'published')
}

function dateEndTs(dateStr) {
  if (!dateStr) return 0
  const m = String(dateStr).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (!m) return 0
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999).getTime()
}

function isActiveActivity(a) {
  if (a.buddyStatus === 'ended') return false
  const end = dateEndTs(a.endDate || a.startDate)
  return !end || end >= Date.now()
}

function activityHeat(a, db) {
  const stats = a.stats || {}
  const applications = (db.applications || []).filter(x => x.activityId === a.id).length
  const joins = (db.joins || []).filter(x => x.activityId === a.id).length
  return Math.log1p(stats.views || a.views || 0) * 3 +
    Math.log1p(stats.likes || a.likeCount || 0) * 4 +
    Math.log1p(stats.collects || a.collectCount || 0) * 4 +
    Math.log1p(a.followCount || 0) * 2 +
    Math.log1p((a.joinCount || 0) + joins + applications) * 2 +
    Math.log1p(a.checkinCount || 0)
}

function rankActivities(list, db) {
  return list.slice().sort((a, b) => {
    const aa = isActiveActivity(a) ? 1 : 0
    const ab = isActiveActivity(b) ? 1 : 0
    if (ab !== aa) return ab - aa
    const pa = a.pinned ? 1 : 0
    const pb = b.pinned ? 1 : 0
    if (pb !== pa) return pb - pa
    const hb = activityHeat(b, db)
    const ha = activityHeat(a, db)
    if (hb !== ha) return hb - ha
    return (b.createdAt || 0) - (a.createdAt || 0)
  })
}

function mixByType(list, db) {
  const active = []
  const expired = []
  list.forEach(a => {
    ;(isActiveActivity(a) ? active : expired).push(a)
  })

  function mix(group) {
    const ranked = rankActivities(group, db)
    const buckets = {}
    ranked.forEach(a => {
      const type = a.type || 'other'
      if (!buckets[type]) buckets[type] = []
      buckets[type].push(a)
    })
    const out = []
    while (out.length < ranked.length) {
      const types = Object.keys(buckets)
        .filter(type => buckets[type].length)
        .sort((a, b) => activityHeat(buckets[b][0], db) - activityHeat(buckets[a][0], db))
      if (!types.length) break
      types.forEach(type => {
        if (buckets[type].length) out.push(buckets[type].shift())
      })
    }
    return out
  }

  return mix(active).concat(mix(expired))
}

/* ---- 列表 ---- */
router.get('/', (req, res) => {
  const db = store.getDB()
  let list = db.activities.filter(a => a.status === 'published')
  if (req.query.type) list = list.filter(a => a.type === req.query.type)
  if (req.query.city) list = list.filter(a => String(a.city || '') === String(req.query.city))
  list = req.query.type ? rankActivities(list, db) : mixByType(list, db)
  const uid = req.query.uid || ''
  ok(res, { items: list.map(a => absCover(req, enrichActivity(a, uid))) })
})

/* ---- 我加入的（须在 :id 之前） ---- */
router.get('/joined', (req, res) => {
  const uid = String(req.query.uid || '')
  if (!uid) return ok(res, { items: [] })
  const db = store.getDB()
  const mine = (db.joins || [])
    .filter(j => j.uid === uid)
    .sort((a, b) => b.at - a.at)
    .map(j => {
      const a = db.activities.find(x => x.id === j.activityId && x.status === 'published')
      return a ? absCover(req, enrichActivity(a, uid)) : null
    })
    .filter(Boolean)
  ok(res, { items: mine })
})

/* ---- 详情 ---- */
router.get('/:id', (req, res) => {
  const a = findActivity(req.params.id)
  if (!a) return fail(res, 4040, '活动不存在')
  ok(res, absCover(req, enrichActivity(a, req.query.uid || '')))
})

/* ---- 加入官方活动（幂等） ---- */
router.post('/:id/join', (req, res) => {
  const a = findActivity(req.params.id)
  if (!a) return fail(res, 4040, '活动不存在')
  if (a.type !== 'official') return fail(res, 4107, '仅官方活动支持加入')
  const uid = String((req.body || {}).uid || '')
  if (!uid) return fail(res, 4201, '缺少用户标识')

  const db = store.getDB()
  db.joins = db.joins || []
  let rec = db.joins.find(j => j.activityId === a.id && j.uid === uid)
  if (!rec) {
    rec = { activityId: a.id, uid, at: Date.now(), checkinAt: 0 }
    db.joins.push(rec)
    store.persist()
  }
  const joinCount = db.joins.filter(j => j.activityId === a.id).length + (a.joinCount || 0)
  ok(res, { joined: true, joinCount })
})

/* ---- 找搭子加入（联系方式仅发起人可见） ---- */
router.post('/:id/apply', (req, res) => {
  const a = findActivity(req.params.id)
  if (!a) return fail(res, 4040, '活动不存在')
  if (a.type !== 'buddy') return fail(res, 4107, '仅找搭子支持加入')
  if (a.buddyStatus === 'ended') return fail(res, 4107, '该练舞局已结束')
  const b = req.body || {}
  const uid = String(b.uid || '')
  if (!uid) return fail(res, 4201, '缺少用户标识')
  if (a.initiatorUid && a.initiatorUid === uid) return fail(res, 4107, '不能加入自己的局')
  const contactWechat = String(b.contactWechat || '').slice(0, 40).trim()
  if (!contactWechat) return fail(res, 4201, '请填写微信号')

  const db = store.getDB()
  db.applications = db.applications || []
  if (db.applications.some(x => x.activityId === a.id && x.applicantUid === uid)) {
    return fail(res, 4103, '已加入过')
  }
  db.applications.unshift({
    id: store.uid('ap'),
    activityId: a.id,
    requestId: a.sourceRequestId || '',
    applicantUid: uid,
    message: String(b.message || '').slice(0, 100),
    contactWechat,
    contactPhone: String(b.contactPhone || '').slice(0, 20),
    createdAt: Date.now()
  })
  store.persist()
  const applicationCount = db.applications.filter(x => x.activityId === a.id).length
  ok(res, { applied: true, applicationCount })
})

/* ---- 现场打卡（须已加入，一次） ---- */
router.post('/:id/checkin', (req, res) => {
  const a = findActivity(req.params.id)
  if (!a) return fail(res, 4040, '活动不存在')
  const uid = String((req.body || {}).uid || '')
  if (!uid) return fail(res, 4201, '缺少用户标识')

  const db = store.getDB()
  const rec = (db.joins || []).find(j => j.activityId === a.id && j.uid === uid)
  if (!rec) return fail(res, 4108, '请先加入活动')
  if (rec.checkinAt) return ok(res, { checkedIn: true, checkinCount: countCheckins(a.id), msg: '已打卡过' })

  rec.checkinAt = Date.now()
  a.checkinCount = (a.checkinCount || 0) + 1
  store.persist()
  ok(res, { checkedIn: true, checkinCount: a.checkinCount })
})

function countCheckins(activityId) {
  const db = store.getDB()
  const dynamic = (db.joins || []).filter(j => j.activityId === activityId && j.checkinAt).length
  return dynamic
}

module.exports = router
