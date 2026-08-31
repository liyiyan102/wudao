/**
 * 内容 API（小程序读）· 非社区版
 * GET /api/content/feed?scope=discover|city&city=&tab=culture|outfit|fresh
 * GET /api/content/posts/:id
 */
const express = require('express')
const store = require('../store')
const { ok, fail } = require('../utils/resp')
const { enrichPost } = require('../utils/enrich')
const { absUpload, rewriteMarkdownMedia } = require('../utils/public-url')

const router = express.Router()

// tab → 分类映射（与小程序 FEED_TABS 一致）
const TAB_CATS = {
  culture: ['culture'],
  outfit: ['outfit'],
  fresh: ['fresh', 'studio']
}

/** 仅把后台上传的 /uploads 转成绝对地址；/images 仍走小程序本地资源 */
function absMedia(req, u) {
  return absUpload(req, u)
}

function absolutize(req, p) {
  if (p.images && p.images.length) {
    p.images = p.images.map(u => absMedia(req, u))
    p.coverUrl = p.images[0] || ''
  }
  if (p.publisher && p.publisher.avatar) {
    p.publisher.avatar = absMedia(req, p.publisher.avatar)
  }
  if (p.body) p.body = rewriteMarkdownMedia(req, p.body)
  return p
}

router.get('/feed', (req, res) => {
  const db = store.getDB()
  const { scope, city, tab } = req.query
  let list = db.posts.filter(p => p.status === 'published')
  const rank = require('../utils/rank-posts')
  if (scope === 'city' && city) {
    list = list.filter(p => rank.sameCity(p.city, city) || rank.isNationwideCity(p.city))
  }
  else if (tab && TAB_CATS[tab]) list = list.filter(p => TAB_CATS[tab].indexOf(p.cat) > -1)
  const feedScope = scope || (tab ? 'tab' : 'discover')
  // 发现流才吃置顶加分；城市 / 分类 tab 无置顶逻辑
  list = rank.sortFeed(list, { city: city || '', scope: feedScope })
  ok(res, { items: list.map(p => absolutize(req, enrichPost(p))) })
})

router.get('/posts/:id', (req, res) => {
  const db = store.getDB()
  const p = db.posts.find(x => x.id === req.params.id)
  if (!p || p.status !== 'published') return fail(res, 4040, '内容不存在')
  // 阅读量计入热度（推荐用）
  if (!p.stats) p.stats = { views: 0, completes: 0, shares: 0 }
  p.stats.views = (p.stats.views || 0) + 1
  store.persist()
  ok(res, absolutize(req, enrichPost(p, true)))
})

module.exports = router
