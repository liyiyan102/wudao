/**
 * 点赞 / 收藏计数（公开页）
 * POST /api/engage  { uid, kind: post|activity, id, action: like|collect, on }
 */
const express = require('express')
const store = require('../store')
const { ok, fail } = require('../utils/resp')

const router = express.Router()

function ensureStats(item) {
  if (!item.stats) item.stats = { views: 0, completes: 0, shares: 0, likes: 0, collects: 0 }
  if (typeof item.stats.likes !== 'number') item.stats.likes = 0
  if (typeof item.stats.collects !== 'number') item.stats.collects = 0
  return item.stats
}

function findTarget(kind, id) {
  const db = store.getDB()
  if (kind === 'post') return (db.posts || []).find(x => x.id === id)
  if (kind === 'activity') return (db.activities || []).find(x => x.id === id)
  return null
}

function countsOf(item) {
  const s = ensureStats(item)
  return { likeCount: s.likes || 0, collectCount: s.collects || 0 }
}

router.post('/', (req, res) => {
  const b = req.body || {}
  const uid = String(b.uid || '').trim()
  const kind = b.kind === 'activity' ? 'activity' : 'post'
  const id = String(b.id || '').trim()
  const action = b.action === 'collect' ? 'collect' : 'like'
  const on = !!b.on
  if (!uid) return fail(res, 4201, '缺少用户标识')
  if (!id) return fail(res, 4201, '缺少内容')

  const item = findTarget(kind, id)
  if (!item) return fail(res, 4040, '不存在')

  const db = store.getDB()
  db.reactions = db.reactions || []
  const type = action
  const i = db.reactions.findIndex(x => x.uid === uid && x.kind === kind && x.id === id && x.type === type)
  const stats = ensureStats(item)
  const key = action === 'collect' ? 'collects' : 'likes'
  let changed = false
  if (on && i < 0) {
    db.reactions.push({ uid, kind, id, type, at: Date.now() })
    stats[key] = (stats[key] || 0) + 1
    changed = true
  } else if (!on && i > -1) {
    db.reactions.splice(i, 1)
    stats[key] = Math.max(0, (stats[key] || 0) - 1)
    changed = true
  }
  if (changed) store.persist()
  ok(res, countsOf(item))
})

module.exports = router
