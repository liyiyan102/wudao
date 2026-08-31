/**
 * 内存限频（架构 §5.3；单进程 PM2 部署下内存实现足够）
 * - 间隔型（发帖 60s/条、评论 15s/条、加入 30s/条）
 * - 窗口型（搜索 10 次/min、上传 30 次/min）
 * - 日限额（发帖 20/日、加入 50/日）用 users.postWindow/applyWindow 字段（见各路由）
 */
const buckets = new Map() // key → { last: ts, count: n, windowStart: ts }

function keyOf(req, name) {
  const uid = req.user ? String(req.user._id) : 'ip:' + (req.ip || 'unknown')
  return name + ':' + uid
}

/** 间隔限频：距上次操作不足 intervalMs 则拒绝 */
function interval(name, intervalMs) {
  return (req, res, next) => {
    const key = keyOf(req, name)
    const b = buckets.get(key)
    const now = Date.now()
    if (b && now - b.last < intervalMs) {
      return res.status(200).json({ code: 429, msg: '操作太频繁，稍后再试' })
    }
    buckets.set(key, { last: now, windowStart: b ? b.windowStart : now, count: b ? b.count : 0 })
    next()
  }
}

/** 窗口限频：windowMs 内最多 max 次 */
function window(name, windowMs, max) {
  return (req, res, next) => {
    const key = keyOf(req, name)
    const now = Date.now()
    let b = buckets.get(key)
    if (!b || now - b.windowStart > windowMs) {
      b = { last: now, windowStart: now, count: 0 }
      buckets.set(key, b)
    }
    b.count++
    if (b.count > max) {
      return res.status(200).json({ code: 429, msg: '操作太频繁，稍后再试' })
    }
    next()
  }
}

// 定期清理过期桶，防内存缓慢增长
setInterval(() => {
  const now = Date.now()
  for (const [k, b] of buckets) {
    if (now - (b.last || b.windowStart) > 24 * 3600 * 1000) buckets.delete(k)
  }
}, 3600 * 1000).unref()

module.exports = { interval, window }
