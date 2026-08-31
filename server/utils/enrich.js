/**
 * 富化层：服务端 → 小程序卡片结构（与 local adapter 输出对齐，页面零改动）
 */
const store = require('../store')
const { readMinutes } = require('../admin/md')
const { getDefaultCover, isUsableCover } = require('./default-covers')

function relativeTime(ts) {
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 3600 * 1000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400 * 1000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 7 * 86400 * 1000) return Math.floor(diff / 86400000) + '天前'
  return (d.getMonth() + 1) + '月' + d.getDate() + '日'
}

function pad(n) { return n < 10 ? '0' + n : '' + n }

function formatWeek(ts) {
  if (!ts) return '时间不限'
  const w = ['日', '一', '二', '三', '四', '五', '六']
  const d = new Date(ts)
  return '周' + w[d.getDay()] + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function publisherOf(id) {
  const u = store.getDB().users.find(x => x.id === id)
  return u ? { id: u.id, nickname: u.nickname, avatar: u.avatar || '' }
    : { id: '', nickname: '舞岛', avatar: '' }
}

/** 内容富化（withDetail=true 时附 readMin/related/相关推荐） */
function enrichPost(p, withDetail) {
  const cat = store.CATS[p.cat] || { name: '其他', tagCls: '', coverCls: 'p' }
  const isPGC = true // 非社区版全部 PGC
  const images = Array.isArray(p.images) ? p.images : []
  const publisher = publisherOf(p.publisherId)
  const out = Object.assign({}, p, {
    catName: cat.name,
    tagCls: cat.tagCls || '',
    coverCls: cat.coverCls || 'p',
    isPGC,
    images,
    hasCover: !p.noCover && (isPGC || !!images.length || !!p.video),
    coverUrl: images[0] || '',
    publisher,
    nickInitial: (publisher.nickname || '舞').charAt(0),
    timeText: relativeTime(p.createdAt),
    likeCount: (p.stats && p.stats.likes) || p.likeCount || 0,
    collectCount: (p.stats && p.stats.collects) || p.collectCount || 0,
    commentCount: 0
  })
  if (withDetail) {
    out.readMin = readMinutes(p.body)
    const db = store.getDB()
    out.related = db.posts
      .filter(x => x.cat === p.cat && x.id !== p.id && x.status === 'published')
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 3)
      .map(x => enrichPost(x))
  } else {
    // 信息流不带长正文，避免开发者工具 setData 过大/渲染卡住
    const raw = String(p.body || '').replace(/[#>*`\[\]]/g, '')
    out.body = raw.slice(0, 80)
  }
  return out
}

function enrichActivity(a, uid) {
  const sub = a.type === 'buddy' ? (store.BUDDY_SUBTYPES[a.buddySubType] || store.BUDDY_SUBTYPES.practice) : null
  const t = store.ACT_TYPES[a.type] || store.ACT_TYPES.official
  const n = a.followCount || 0
  const db = store.getDB()
  const joins = db.joins || []
  const apps = (db.applications || []).filter(x => x.activityId === a.id)
  const mine = uid ? joins.find(j => j.activityId === a.id && j.uid === uid) : null
  const applied = uid ? apps.some(x => x.applicantUid === uid) : false
  const isInitiator = !!(uid && a.initiatorUid && a.initiatorUid === uid)
  const applicationCount = apps.length

  const { composeActivitySchedule } = require('./dates')
  const sched = composeActivitySchedule(a)
  const dateText = sched.dateText
  const timeText = sched.timeText
  const timeLabel = sched.timeLabel
  const dateMode = sched.dateMode
  const weekdays = sched.weekdays

  return {
    id: a.id,
    type: a.type,
    typeName: sub ? sub.badge : t.name,
    badgeName: sub ? sub.badge : t.name,
    buddySubType: a.buddySubType || '',
    buddySubTypeName: sub ? sub.name : '',
    buddyStatus: a.buddyStatus || (a.type === 'buddy' ? 'recruiting' : ''),
    grad: sub ? sub.grad : t.grad,
    typeColor: sub ? sub.color : t.color,
    title: a.title,
    shortTitle: a.shortTitle || '',
    desc: a.desc,
    coverUrl: isUsableCover(a.coverUrl) ? a.coverUrl : getDefaultCover(a.type, a.buddySubType),
    city: a.city,
    location: a.location || '',
    lat: a.lat,
    lng: a.lng,
    startDate: a.startDate || '',
    endDate: a.endDate || '',
    startTime: a.startTime || '',
    endTime: a.endTime || '',
    dateMode,
    weekdays,
    dateText,
    timeText,
    timeLabel,
    danceTypes: a.danceTypes || '',
    contestName: a.contestName || '',
    organizer: a.organizer || '舞岛官方',
    followCount: n,
    followText: n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n),
    followed: false,
    joinCount: (a.joinCount || 0) + joins.filter(j => j.activityId === a.id).length,
    checkinCount: a.checkinCount || 0,
    joined: !!mine,
    checkedIn: !!(mine && mine.checkinAt),
    checkinAt: mine ? mine.checkinAt || 0 : 0,
    schedule: a.schedule || [],
    notes: a.notes || '',
    headcount: a.headcount || '不限',
    applicationCount,
    applied,
    isInitiator,
    sourceRequestId: isInitiator ? (a.sourceRequestId || '') : '',
    likeCount: (a.stats && a.stats.likes) || a.likeCount || 0,
    collectCount: (a.stats && a.stats.collects) || a.collectCount || 0,
    pinned: !!a.pinned,
    status: a.status,
    createdAt: a.createdAt
  }
}

module.exports = { enrichPost, enrichActivity, relativeTime, formatWeek }
