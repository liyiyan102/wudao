/**
 * 内容信息流排序
 * - 置顶：仅按后台手动 sort（越小越靠前）
 * - 非置顶：推荐分 = 定位 + 时效 + 热度，再按分类做轻量打散
 *
 * 权重（简单可调）：
 *   定位 0.30 · 时效 0.40 · 热度 0.30
 */
const W_LOC = 0.30
const W_FRESH = 0.40
const W_HEAT = 0.30
/** 时效半衰期（天）：约 7 天后新鲜度减半 */
const FRESH_HALF_LIFE_DAYS = 7
/** 发现流：置顶只加分，不独占头部；同类尽量不连排 */
const PIN_BONUS = 0.18

function heatRaw(p) {
  const s = p.stats || {}
  const views = Number(s.views) || 0
  const shares = Number(s.shares) || 0
  const completes = Number(s.completes) || 0
  const likes = Number(s.likes || s.likeCount || p.likeCount) || 0
  const collects = Number(s.collects || s.collectCount || p.collectCount) || 0
  // 分享、收藏权重略高，兼顾显性互动和阅读质量
  return Math.log1p(views) +
    2 * Math.log1p(shares) +
    Math.log1p(completes) +
    1.4 * Math.log1p(likes) +
    1.8 * Math.log1p(collects)
}

function freshScore(p, now) {
  const ageMs = Math.max(0, (now || Date.now()) - (p.createdAt || 0))
  const ageDays = ageMs / 86400000
  return Math.exp(-ageDays / FRESH_HALF_LIFE_DAYS)
}

function isNationwideCity(city) {
  const c = String(city || '').trim()
  return c === '不限' || c === '全国'
}

function normalizeCity(city) {
  return String(city || '').trim().replace(/市$/, '')
}

function sameCity(a, b) {
  const ca = normalizeCity(a)
  const cb = normalizeCity(b)
  return !!ca && ca === cb
}

function locScore(p, city) {
  const c = normalizeCity(city)
  if (!c) return 0.5
  const pc = String(p.city || '').trim()
  if (sameCity(pc, c)) return 1
  if (isNationwideCity(pc)) return 0.22
  if (!pc) return 0.35
  return 0.15
}

/** 在候选集内归一化热度到 [0,1] */
function heatNormMap(list) {
  let max = 0
  const raw = list.map(p => {
    const h = heatRaw(p)
    if (h > max) max = h
    return h
  })
  return list.map((_, i) => (max > 0 ? raw[i] / max : 0))
}

function recommendScore(p, idx, heatNorm, city, now) {
  return (
    W_LOC * locScore(p, city) +
    W_FRESH * freshScore(p, now) +
    W_HEAT * (heatNorm[idx] || 0)
  )
}

function scorePosts(list, city, now, pinBonus) {
  const heatNorm = heatNormMap(list)
  const scored = list.map((p, i) => ({
    p,
    score: recommendScore(p, i, heatNorm, city, now) + (pinBonus && p.pinned ? PIN_BONUS : 0)
  }))
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return (b.p.createdAt || 0) - (a.p.createdAt || 0)
  })
  return dedupeScored(scored)
}

function sortByRecommend(list, city, now) {
  return mixByCat(scorePosts(list, city, now, false))
}

function titleKey(p) {
  return String((p && p.title) || '')
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase()
}

function topicKey(p) {
  return titleKey(p)
    .replace(/[^\u4e00-\u9fa5a-z0-9]/g, '')
    .slice(0, 4)
}

function dedupeScored(scored) {
  const seenIds = {}
  const seenTitles = {}
  const seenTopics = {}
  return scored.filter(x => {
    const id = x.p && x.p.id
    const key = titleKey(x.p)
    const topic = topicKey(x.p)
    const topicScope = (x.p && x.p.cat ? x.p.cat : 'other') + ':' + topic
    if (id && seenIds[id]) return false
    if (key && seenTitles[key]) return false
    if (topic.length >= 4 && seenTopics[topicScope]) return false
    if (id) seenIds[id] = true
    if (key) seenTitles[key] = true
    if (topic.length >= 4) seenTopics[topicScope] = true
    return true
  })
}

/** 按分类轮流发牌：每一轮每个类目最多出一条，头部多样性更强 */
function mixByCat(scored) {
  const buckets = {}
  scored.forEach(x => {
    const cat = x.p.cat || 'other'
    if (!buckets[cat]) buckets[cat] = []
    buckets[cat].push(x)
  })
  const cats = Object.keys(buckets)
  const out = []
  while (out.length < scored.length) {
    const roundCats = cats
      .filter(cat => buckets[cat].length)
      .sort((a, b) => buckets[b][0].score - buckets[a][0].score)
    if (!roundCats.length) break
    roundCats.forEach(cat => {
      if (buckets[cat].length) out.push(buckets[cat].shift())
    })
  }
  return out.map(x => x.p)
}

/**
 * 信息流排序
 * - 发现 tab：置顶只加分，不独占头部
 * - 城市 / 分类 tab：无置顶逻辑
 */
function sortFeed(list, opts) {
  opts = opts || {}
  const city = opts.city || ''
  const now = opts.now || Date.now()
  const scope = opts.scope || ''
  if (scope === 'city' && city) {
    const local = []
    const nation = []
    const other = []
    ;(list || []).forEach(p => {
      const pc = String(p.city || '').trim()
      if (sameCity(pc, city)) local.push(p)
      else if (isNationwideCity(pc)) nation.push(p)
      else other.push(p)
    })
    return sortByRecommend(local, city, now)
      .concat(sortByRecommend(nation, city, now), sortByRecommend(other, city, now))
  }
  if (scope === 'discover' || !scope) {
    return mixByCat(scorePosts(list || [], city, now, true))
  }
  return sortByRecommend(list || [], city, now)
}

/** 后台列表：置顶按 sort，其余按发布时间倒序（不走推荐，方便编辑） */
function sortAdminPosts(list) {
  return (list || []).slice().sort((a, b) => {
    const pa = a.pinned ? 1 : 0
    const pb = b.pinned ? 1 : 0
    if (pb !== pa) return pb - pa
    if (a.pinned && b.pinned) {
      const sa = typeof a.sort === 'number' ? a.sort : Number.MAX_SAFE_INTEGER
      const sb = typeof b.sort === 'number' ? b.sort : Number.MAX_SAFE_INTEGER
      if (sa !== sb) return sa - sb
    }
    return (b.createdAt || 0) - (a.createdAt || 0)
  })
}

/** 仅对置顶帖写入 sort（0..n-1）；忽略非置顶 id */
function applyPinnedReorder(list, ids) {
  const idSet = {}
  ;(list || []).forEach(p => { if (p.pinned) idSet[p.id] = true })
  const valid = (ids || []).filter(id => idSet[id])
  valid.forEach((id, i) => {
    const item = list.find(x => x.id === id)
    if (item && item.pinned) item.sort = i
  })
  return valid.length
}

/** 置顶时插到置顶区最前 */
function assignPinSort(list, post) {
  let min = 0
  ;(list || []).forEach(x => {
    if (x.pinned && typeof x.sort === 'number' && x.sort < min) min = x.sort
  })
  post.sort = min - 1
}

module.exports = {
  sortFeed,
  sortAdminPosts,
  applyPinnedReorder,
  assignPinSort,
  recommendScore,
  isNationwideCity,
  sameCity,
  W_LOC, W_FRESH, W_HEAT, FRESH_HALF_LIFE_DAYS, PIN_BONUS
}
