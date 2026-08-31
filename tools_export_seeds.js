/**
 * 一次性脚本：把小程序 utils/data.js 种子导出为 server/seeds-data.json（非社区版）
 */
const fs = require('fs')
const path = require('path')
const { seed, HOT_SEARCHES } = require('./utils/data')

const s = seed()
const out = {
  users: s.users.map(u => ({ id: u.id, nickname: u.nickname, avatar: u.avatar || '', city: u.city || '' })),
  posts: s.posts.map(p => ({
    id: p.id, cat: p.cat, title: p.title, body: p.body || '',
    images: p.images || [], video: p.video || '',
    publisherId: p.publisherId, city: p.city || '北京',
    pinned: !!p.pinned, noCover: !!p.noCover,
    createdAt: p.createdAt
  })),
  activities: s.activities.map(a => ({
    id: a.id, type: a.type, title: a.title, shortTitle: a.shortTitle || '',
    desc: a.desc || '', city: a.city || '北京', location: a.location || '',
    lat: a.lat, lng: a.lng,
    dateText: a.dateText, timeText: a.timeText, danceTypes: a.danceTypes || '',
    organizer: a.organizer || '', followCount: a.followCount || 0,
    schedule: a.schedule || [], notes: a.notes || ''
  })),
  hotSearches: HOT_SEARCHES
}

const file = path.join(__dirname, 'server', 'seeds-data.json')
fs.writeFileSync(file, JSON.stringify(out, null, 1))
console.log('导出完成 →', file)
console.log('用户:', out.users.length, '| 帖子:', out.posts.length, '| 活动:', out.activities.length, '| 热词:', out.hotSearches.length)
