/**
 * 定时任务（架构 §6.6，node-cron 与主服务同进程）
 * - 每小时：搭子帖过期下架（time < now-7d 且 recruiting）+ 孤儿媒体清理（temporary > 24h）
 * - 每日 03:00：mongodump 备份（生产；保留 7 份）
 * - 每周日 04:00：软删数据物理清理（90 天，含关联 uploads）
 */
const cron = require('node-cron')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const config = require('../config')
const { getDB } = require('../db')

async function expireBuddyPosts() {
  const db = getDB()
  const threshold = new Date(Date.now() - 7 * 24 * 3600 * 1000)
  const r = await db.collection('buddy_posts').updateMany(
    { status: 'recruiting', time: { $type: 'date', $lt: threshold } },
    { $set: { status: 'ended' } }
  )
  if (r.modifiedCount) console.log('[cron] 搭子帖过期下架:', r.modifiedCount)
}

async function cleanOrphanUploads() {
  const db = getDB()
  const threshold = new Date(Date.now() - 24 * 3600 * 1000)
  const orphans = await db.collection('uploads')
    .find({ status: 'temporary', createdAt: { $lt: threshold } }).toArray()
  for (const o of orphans) {
    try { fs.unlinkSync(path.join(config.UPLOAD_DIR, o.path)) } catch (e) { /* 文件已不在 */ }
    await db.collection('uploads').updateOne({ _id: o._id }, { $set: { status: 'deleted' } })
  }
  if (orphans.length) console.log('[cron] 孤儿媒体清理:', orphans.length)
}

async function purgeSoftDeleted() {
  const db = getDB()
  const threshold = new Date(Date.now() - 90 * 24 * 3600 * 1000)
  // 帖子软删 90 天 → 物理删除
  const dead = await db.collection('posts').find({ status: 'deleted', updatedAt: { $lt: threshold } }).toArray()
  for (const p of dead) {
    await db.collection('comments').deleteMany({ postId: String(p._id) })
    await db.collection('reactions').deleteMany({ targetId: String(p._id) })
    await db.collection('messages').deleteMany({ targetId: String(p._id) })
    await db.collection('posts').deleteOne({ _id: p._id })
  }
  if (dead.length) console.log('[cron] 软删帖子物理清理:', dead.length)
}

function backup() {
  if (config.isDev) return
  const dir = '/data/wudao/backups'
  fs.mkdirSync(dir, { recursive: true })
  const file = dir + '/wudao-' + new Date().toISOString().slice(0, 10) + '.gz'
  exec(`mongodump --db wudao --archive --gzip > ${file}`, (err) => {
    if (err) return console.error('[cron] 备份失败:', err.message)
    // 保留最近 7 份
    const files = fs.readdirSync(dir).filter(f => f.startsWith('wudao-')).sort()
    while (files.length > 7) fs.unlinkSync(path.join(dir, files.shift()))
    console.log('[cron] 备份完成:', file)
  })
}

function start() {
  cron.schedule('0 * * * *', () => {
    expireBuddyPosts().catch(e => console.error('[cron]', e.message))
    cleanOrphanUploads().catch(e => console.error('[cron]', e.message))
  })
  cron.schedule('0 4 * * 0', () => {
    purgeSoftDeleted().catch(e => console.error('[cron]', e.message))
  })
  cron.schedule('0 3 * * *', backup)
  console.log('[cron] jobs started（每小时过期/孤儿清理；每日 03:00 备份；每周日 04:00 软删清理）')
}

module.exports = { start }
