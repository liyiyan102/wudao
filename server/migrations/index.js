/**
 * 幂等迁移（架构 §8.4：数据库结构变更走脚本，禁止手工改线上库）
 * - ensureIndexes：全部索引（§4.3）
 * - seed：posts 空库时灌入种子（来自小程序 utils/data.js 导出的 seeds-data.json）
 *   · liked/collected/comments 数组 → reactions / comments 集合 + stats 冗余计数
 *   · buddy applies 数组 → applies 集合
 *   · 种子用户 openid = 'seed_<id>'（official 账号承载 PGC）
 *
 * 可独立运行：npm run migrate
 */
const fs = require('fs')
const path = require('path')
const { getDB } = require('../db')

async function ensureIndexes() {
  const db = getDB()
  const c = {
    users: db.collection('users'),
    posts: db.collection('posts'),
    buddy: db.collection('buddy_posts'),
    applies: db.collection('applies'),
    comments: db.collection('comments'),
    reactions: db.collection('reactions'),
    messages: db.collection('messages'),
    uploads: db.collection('uploads'),
    sessions: db.collection('sessions'),
    track: db.collection('track'),
    hot: db.collection('hot_searches')
  }

  await c.users.createIndex({ openid: 1 }, { unique: true })
  await c.posts.createIndex({ status: 1, createdAt: -1 })
  await c.posts.createIndex({ city: 1, status: 1, createdAt: -1 })
  await c.posts.createIndex({ cat: 1, status: 1, createdAt: -1 })
  await c.posts.createIndex({ 'mediaAudit.traceId': 1 })
  await c.buddy.createIndex({ status: 1, createdAt: -1 })
  await c.buddy.createIndex({ city: 1, buddyType: 1, status: 1, createdAt: -1 })
  await c.buddy.createIndex({ contentStatus: 1, createdAt: -1 })
  await c.buddy.createIndex({ 'mediaAudit.traceId': 1 })
  await c.applies.createIndex({ userId: 1, postId: 1 }, { unique: true }) // 并发重复加入数据库级兜底（§4.3 P0）
  await c.applies.createIndex({ postId: 1, createdAt: -1 })
  await c.comments.createIndex({ postId: 1, status: 1, createdAt: -1 })
  await c.reactions.createIndex({ userId: 1, targetId: 1, type: 1 }, { unique: true })
  await c.reactions.createIndex({ userId: 1, type: 1, createdAt: -1 })
  await c.messages.createIndex({ toUserId: 1, read: 1, createdAt: -1 })
  await c.uploads.createIndex({ status: 1, createdAt: 1 })
  await c.uploads.createIndex({ userId: 1, path: 1 })
  await c.sessions.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }) // TTL 自动清理
  await c.track.createIndex({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 }) // 原始事件 90 天（§9.2）
  await c.track.createIndex({ event: 1, createdAt: -1 })
  await c.hot.createIndex({ enabled: 1, weight: -1 })
  console.log('[migrate] indexes ok')
}

/** 种子灌入（幂等：仅空库执行） */
async function seed() {
  const db = getDB()
  if (await db.collection('posts').countDocuments() > 0) {
    console.log('[migrate] seed skipped（已有数据）')
    return
  }
  const file = path.join(__dirname, '..', 'seeds-data.json')
  if (!fs.existsSync(file)) {
    console.warn('[migrate] seeds-data.json 不存在，跳过种子（运行小程序侧 tools_export_seeds.js 生成）')
    return
  }
  const seeds = JSON.parse(fs.readFileSync(file, 'utf-8'))
  const base = Date.now() - 30 * 24 * 3600 * 1000

  // 1. 用户（official 承载 PGC）
  const OFFICIAL = ['u_official', 'u_recovery', 'u_culture', 'u_outfit', 'u_gossip', 'u_contest']
  if (seeds.users && seeds.users.length) {
    const docs = seeds.users.map(u => ({
      _id: u.id,
      openid: 'seed_' + u.id,
      nickname: u.nickname || '舞友',
      avatar: u.avatar || '',
      city: u.city || '北京',
      role: 'user',
      accountType: OFFICIAL.indexOf(u.id) > -1 ? 'official' : 'personal',
      status: 'normal',
      stats: { postCount: 0, buddyCount: 0 },
      postWindow: { count: 0, date: '' },
      applyWindow: { count: 0, date: '' },
      createdAt: new Date(base), updatedAt: new Date(base), lastActiveAt: new Date()
    }))
    await db.collection('users').insertMany(docs)
    console.log('[migrate] users seeded:', docs.length)
  }

  // 2. 内容帖（纯浏览；互动集合已随社交功能下线）
  if (seeds.posts && seeds.posts.length) {
    const docs = seeds.posts.map(p => ({
      _id: p.id, userId: p.publisherId, kind: 'content', cat: p.cat,
      title: p.title, body: p.body || '', images: p.images || [], video: p.video || '',
      city: p.city || '北京', pinned: !!p.pinned, noCover: !!p.noCover,
      status: 'online', mediaAudit: [],
      stats: { likeCount: 0, collectCount: 0, commentCount: 0 },
      createdAt: new Date(p.createdAt), updatedAt: new Date(p.createdAt)
    }))
    await db.collection('posts').insertMany(docs)
    console.log('[migrate] posts seeded:', docs.length)
  }

  // 3. 搭子帖（applies 拆集合）
  if (seeds.buddyPosts && seeds.buddyPosts.length) {
    const applyDocs = []
    const docs = seeds.buddyPosts.map(p => {
      ;(p.applies || []).forEach(a => applyDocs.push({
        _id: a.id, userId: a.userId, postId: p.id, publisherId: p.publisherId,
        message: a.message || '', contact: a.contact || '',
        status: 'viewed', createdAt: new Date(a.createdAt)
      }))
      return {
        _id: p.id, userId: p.publisherId, kind: 'buddy', buddyType: p.buddyType,
        title: p.title, body: p.body || '', images: p.images || [], video: p.video || '',
        city: p.city || '北京', location: p.location || '',
        time: p.time ? new Date(p.time) : 0,
        needCount: p.needCount || 3,
        status: p.status || 'recruiting', contentStatus: 'online', mediaAudit: [],
        stats: { applyCount: (p.applies || []).length },
        createdAt: new Date(p.createdAt)
      }
    })
    await db.collection('buddy_posts').insertMany(docs)
    if (applyDocs.length) await db.collection('applies').insertMany(applyDocs)
    console.log('[migrate] buddy_posts seeded:', docs.length, '/ applies:', applyDocs.length)
  }

  // 4. 热门搜索
  if (seeds.hotSearches && seeds.hotSearches.length) {
    const docs = seeds.hotSearches.map((h, i) => ({
      word: h.word, tag: h.tag || '', weight: seeds.hotSearches.length - i,
      enabled: true, updatedAt: new Date()
    }))
    await db.collection('hot_searches').insertMany(docs)
    console.log('[migrate] hot_searches seeded:', docs.length)
  }
}

async function run() {
  await ensureIndexes()
  await seed()
}

// 独立运行支持
if (require.main === module) {
  const { connectDB } = require('../db')
  connectDB().then(run).then(() => {
    console.log('[migrate] done')
    process.exit(0)
  }).catch(e => {
    console.error('[migrate] failed:', e)
    process.exit(1)
  })
}

module.exports = { run }
