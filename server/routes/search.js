/**
 * 搜索 API（小程序读，仅 PGC 内容）
 * GET /api/search?q=
 * GET /api/search/hot
 */
const express = require('express')
const store = require('../store')
const { ok } = require('../utils/resp')
const { enrichPost, enrichActivity } = require('../utils/enrich')

const router = express.Router()

router.get('/', (req, res) => {
  const kw = String(req.query.q || '').trim().toLowerCase().slice(0, 20)
  if (!kw) return ok(res, { keyword: '', results: [], total: 0 })
  const db = store.getDB()
  const hit = t => t && String(t).toLowerCase().indexOf(kw) > -1
  const posts = db.posts
    .filter(p => p.status === 'published' &&
      (hit(p.title) || hit(p.body) || hit((store.CATS[p.cat] || {}).name) ||
        (p.tags || []).some(hit)))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(p => Object.assign(enrichPost(p), { kind: 'post' }))
  const activities = db.activities
    .filter(a => a.status === 'published' &&
      (hit(a.title) || hit(a.desc) || hit(a.location) || hit(a.city) ||
        hit((store.ACT_TYPES[a.type] || {}).name) || hit(a.danceTypes)))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(a => enrichActivity(a))
    .map(a => Object.assign(a, {
      kind: 'activity',
      catName: a.type === 'buddy' ? '找搭子' : (a.typeName || '活动'),
      tagCls: a.type === 'buddy' ? '' : 'c3',
      hasCover: !!a.coverUrl,
      publisher: { nickname: a.organizer || '舞岛官方', avatar: '' },
      timeText: a.dateText || '',
      body: a.desc || '',
      images: a.coverUrl ? [a.coverUrl] : []
    }))
  const results = posts.concat(activities)
  ok(res, { keyword: kw, results, total: results.length })
})

router.get('/hot', (req, res) => {
  ok(res, store.getDB().hotSearches || [])
})

module.exports = router
