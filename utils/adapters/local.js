/**
 * LocalAdapter · 非社区版（storage mock）
 * 能力：内容浏览流 / 编辑型长内容详情（+浏览历史）/ 活动列表与详情 / 关注活动 / 搜索
 * 无：UGC / 互动 / 消息 / 草稿（个人主体资质约束，PRD v0.2）
 */
const data = require('../data')
const { relativeTime, getUid, genId, isActivityExpired } = require('../util')
const { withDefaultCover } = require('../default-covers')
const { readMinutes } = require('../md')
const engagement = require('../engagement')
const auth = require('../auth')

const DB_KEY = 'wudao_db_v7'
const CITY_KEY = 'wudao_city'
const HISTORY_KEY = 'wudao_history'
const HISTORY_MAX = 100
const FOLLOWED_KEY = 'wudao_followed'
let dbCache = null

/* ================= 底层 ================= */

function load() {
  if (dbCache) return dbCache
  let db = wx.getStorageSync(DB_KEY)
  if (!db || !db.posts || !db.activities) {
    db = data.seed()
    wx.setStorageSync(DB_KEY, db)
  }
  dbCache = db
  return db
}

function save(db) {
  dbCache = db
  wx.setStorageSync(DB_KEY, db)
}

function publisherOf(id) {
  const db = load()
  const u = db.users.find(x => x.id === id)
  return u ? { id: u.id, nickname: u.nickname, avatar: u.avatar || '' } : { id: '', nickname: '舞岛', avatar: '' }
}

function getCity() { return wx.getStorageSync(CITY_KEY) || '北京' }
function setCity(c) { wx.setStorageSync(CITY_KEY, c) }

/* ================= 登录（微信头像 + 昵称） ================= */
const getCurrentUser = auth.getCurrentUser
const isLoggedIn = auth.isLoggedIn
const login = auth.login
const logout = auth.logout
const wxLoginCode = auth.wxLoginCode

function initDB() { load(); return Promise.resolve() }

/* ================= 内容流（纯 PGC 浏览，PRD 4.2） ================= */

function enrichContent(p) {
  const cat = data.CONTENT_CATS[p.cat] || data.CONTENT_CATS.culture
  const publisher = publisherOf(p.publisherId)
  const images = p.images || []
  return Object.assign({}, p, {
    catName: cat.name,
    tagCls: cat.tagCls,
    coverCls: cat.coverCls,
    images,
    hasCover: !p.noCover && (isPGC(p.cat) || !!images.length || !!p.video),
    coverUrl: images[0] || '',
    publisher,
    nickInitial: (publisher.nickname || '舞').charAt(0),
    timeText: relativeTime(p.createdAt),
    likeCount: (p.stats && p.stats.likes) || p.likeCount || 0,
    collectCount: (p.stats && p.stats.collects) || p.collectCount || 0
  })
}

function isPGC(cat) {
  // 非社区版全部内容都是 PGC
  return !!data.CONTENT_CATS[cat]
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

function titleKey(p) {
  return String((p && p.title) || '').trim().replace(/\s+/g, '').toLowerCase()
}

function topicKey(p) {
  return titleKey(p).replace(/[^\u4e00-\u9fa5a-z0-9]/g, '').slice(0, 4)
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

function mixByCat(scored) {
  const buckets = {}
  dedupeScored(scored).forEach(x => {
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

/** 本地信息流：发现 tab 才吃置顶加分；城市 / 分类 tab 无置顶逻辑 */
function rankLocalFeed(list, city, scope) {
  const now = Date.now()
  function heat(p) {
    const s = p.stats || {}
    return Math.log1p(s.views || 0) + 2 * Math.log1p(s.shares || 0) + Math.log1p(s.completes || 0)
  }
  function sortGroup(group, pinBonus) {
    let maxH = 0
    group.forEach(p => { const h = heat(p); if (h > maxH) maxH = h })
    const scored = group.map(p => {
      const ageDays = Math.max(0, now - (p.createdAt || 0)) / 86400000
      const fresh = Math.exp(-ageDays / 7)
      const pc = String(p.city || '').trim()
      const loc = !city ? 0.5 : (sameCity(pc, city) ? 1 : (isNationwideCity(pc) ? 0.22 : 0.15))
      const h = maxH > 0 ? heat(p) / maxH : 0
      const pin = pinBonus && p.pinned ? 0.18 : 0
      return { p, score: 0.30 * loc + 0.40 * fresh + 0.30 * h + pin }
    })
    scored.sort((a, b) => (b.score - a.score) || ((b.p.createdAt || 0) - (a.p.createdAt || 0)))
    if (!pinBonus) return mixByCat(scored)
    const pinned = scored
      .filter(x => x.p && x.p.pinned)
      .sort((a, b) => {
        const sa = typeof a.p.sort === 'number' ? a.p.sort : Number.MAX_SAFE_INTEGER
        const sb = typeof b.p.sort === 'number' ? b.p.sort : Number.MAX_SAFE_INTEGER
        return (sa - sb) || ((b.p.createdAt || 0) - (a.p.createdAt || 0))
      })
    return pinned.concat(mixByCat(scored.filter(x => !x.p || !x.p.pinned)))
  }
  if (scope === 'city' && city) {
    const local = list.filter(p => sameCity(p.city, city))
    const nation = list.filter(p => isNationwideCity(p.city))
    const other = list.filter(p => !sameCity(p.city, city) && !isNationwideCity(p.city))
    return sortGroup(local, false).concat(sortGroup(nation, false), sortGroup(other, false))
  }
  if (scope === 'discover') return sortGroup(list, true)
  return sortGroup(list, false)
}

/** 信息流：置顶优先；其余推荐排序；scope = discover | city | 分类 tab */
function getFeed(scope) {
  const db = load()
  let list = db.posts.slice()
  const city = getCity()
  if (scope === 'city') {
    list = list.filter(p => sameCity(p.city, city) || isNationwideCity(p.city))
  } else if (scope && scope !== 'discover') {
    const tab = data.FEED_TABS.find(t => t.key === scope)
    if (tab && tab.cats) list = list.filter(p => tab.cats.indexOf(p.cat) > -1)
  }
  const feedScope = scope || 'discover'
  return rankLocalFeed(list, city, feedScope).map(enrichContent)
}

/** 详情：富化 + 相关推荐（同分类最新 3 条，PRD 4.3）+ 记入浏览历史 */
function getPost(id) {
  const db = load()
  const p = db.posts.find(x => x.id === id)
  if (!p) return null
  const enriched = enrichContent(p)
  enriched.readMin = readMinutes(p.body)

  const related = db.posts
    .filter(x => x.cat === p.cat && x.id !== id)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3)
    .map(enrichContent)
  enriched.related = related

  addHistory({
    id: p.id, kind: 'post', title: p.title, catName: enriched.catName,
    coverUrl: enriched.coverUrl || (p.images && p.images[0]) || ''
  })
  return enriched
}

/* ================= 活动（PRD 4.4） ================= */

function enrichActivity(a) {
  const sub = a.type === 'buddy' ? (data.BUDDY_SUBTYPES[a.buddySubType] || data.BUDDY_SUBTYPES.practice) : null
  const t = data.ACTIVITY_TYPES[a.type] || data.ACTIVITY_TYPES.official
  const joins = getJoins()
  const mine = joins.find(j => j.id === a.id)
  const uid = getUid()
  const apps = getApps().filter(x => x.activityId === a.id)
  const { composeActivitySchedule } = require('../util')
  const sched = composeActivitySchedule(a)
  return Object.assign({}, a, {
    typeName: sub ? sub.badge : t.name,
    badgeName: sub ? sub.badge : t.name,
    buddySubTypeName: sub ? sub.name : '',
    buddyStatus: a.buddyStatus || (a.type === 'buddy' ? 'recruiting' : ''),
    grad: sub ? sub.grad : t.grad,
    typeColor: sub ? sub.color : t.color,
    startDate: a.startDate || '',
    endDate: a.endDate || '',
    startTime: a.startTime || '',
    endTime: a.endTime || '',
    dateMode: sched.dateMode,
    weekdays: sched.weekdays,
    dateText: sched.dateText,
    timeText: sched.timeText,
    timeLabel: sched.timeLabel,
    location: a.location || '',
    danceTypes: a.danceTypes || '',
    contestName: a.contestName || '',
    coverUrl: withDefaultCover({ coverUrl: a.coverUrl, type: a.type, buddySubType: a.buddySubType }).coverUrl,
    followed: isFollowed(a.id),
    followText: formatFollowCount(a.followCount),
    joinCount: (a.joinCount || 0) + (mine ? 1 : 0),
    checkinCount: a.checkinCount || 0,
    joined: !!mine,
    checkedIn: !!(mine && mine.checkinAt),
    checkinAt: mine ? mine.checkinAt || 0 : 0,
    applicationCount: apps.length,
    applied: apps.some(x => x.applicantUid === uid),
    isInitiator: a.initiatorUid === uid,
    headcount: a.headcount || '不限',
    likeCount: (a.stats && a.stats.likes) || a.likeCount || 0,
    collectCount: (a.stats && a.stats.collects) || a.collectCount || 0
  })
}

/* ================= 加入官方活动 & 现场打卡 ================= */

const JOINS_KEY = 'wudao_joins'

function getJoins() { return wx.getStorageSync(JOINS_KEY) || [] }

/** 加入官方活动：返回 { joined, joinCount } */
function joinActivity(id) {
  const db = load()
  const a = db.activities.find(x => x.id === id)
  if (!a) return { joined: false, joinCount: 0, msg: '活动不存在' }
  const joins = getJoins()
  if (joins.some(j => j.id === id)) {
    return { joined: true, joinCount: (a.joinCount || 0) + 1, msg: '已加入过' }
  }
  joins.unshift({ id, at: Date.now(), checkinAt: 0 })
  wx.setStorageSync(JOINS_KEY, joins)
  return { joined: true, joinCount: (a.joinCount || 0) + 1 }
}

/** 现场打卡：需已加入且未打卡；返回 { checkedIn, checkinCount } */
function checkInActivity(id) {
  const db = load()
  const a = db.activities.find(x => x.id === id)
  if (!a) return { checkedIn: false, checkinCount: 0, msg: '活动不存在' }
  const joins = getJoins()
  const mine = joins.find(j => j.id === id)
  if (!mine) return { checkedIn: false, checkinCount: a.checkinCount || 0, msg: '请先加入活动' }
  if (mine.checkinAt) return { checkedIn: true, checkinCount: a.checkinCount || 0, msg: '已打卡过' }
  mine.checkinAt = Date.now()
  wx.setStorageSync(JOINS_KEY, joins)
  a.checkinCount = (a.checkinCount || 0) + 1
  save(db)
  return { checkedIn: true, checkinCount: a.checkinCount }
}

/** 我加入的活动（按加入时间倒序） */
function getJoinedActivities() {
  const db = load()
  return getJoins().map(j => {
    const a = db.activities.find(x => x.id === j.id)
    return a ? enrichActivity(a) : null
  }).filter(Boolean)
}

/* ================= 代发撮合 ================= */
const REQ_KEY = 'wudao_buddy_requests'
const APP_KEY = 'wudao_applications'

function getReqs() { return wx.getStorageSync(REQ_KEY) || [] }
function saveReqs(list) { wx.setStorageSync(REQ_KEY, list) }
function getApps() { return wx.getStorageSync(APP_KEY) || [] }
function saveApps(list) { wx.setStorageSync(APP_KEY, list) }

function publicReq(r) {
  const st = data.BUDDY_REQUEST_STATUS[r.status] || data.BUDDY_REQUEST_STATUS.pending
  const sub = data.BUDDY_SUBTYPES[r.subType] || data.BUDDY_SUBTYPES.practice
  const applicationCount = r.linkedActivityId
    ? getApps().filter(x => x.activityId === r.linkedActivityId).length
    : 0
  return Object.assign({}, r, {
    subTypeName: sub.name,
    statusName: st.name,
    applicationCount,
    contactWechat: undefined,
    contactPhone: undefined
  })
}

function submitBuddyRequest(payload) {
  const uid = getUid()
  const reqs = getReqs()
  if (reqs.filter(r => r.uid === uid && r.status === 'pending').length >= 3) {
    return Promise.reject({ msg: '审核中的需求最多 3 条，请等审核完成' })
  }
  const rec = Object.assign({
    id: genId('br'),
    uid,
    subType: 'practice',
    title: '',
    description: '',
    danceStyle: '',
    city: '北京',
    location: '',
    dateText: '',
    timeText: '',
    headcount: '不限',
    status: 'pending',
    rejectReason: '',
    linkedActivityId: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }, payload, { uid, status: 'pending' })
  rec.title = String(rec.title || '').slice(0, 30)
  if (!rec.title) return Promise.reject({ msg: '请填写标题' })
  if (!rec.contactWechat) return Promise.reject({ msg: '请填写微信号' })
  reqs.unshift(rec)
  saveReqs(reqs)
  return Promise.resolve(publicReq(rec))
}

function getMyBuddyRequests() {
  const uid = getUid()
  return Promise.resolve(getReqs().filter(r => r.uid === uid).map(publicReq))
}

function getBuddyRequest(id) {
  const uid = getUid()
  const r = getReqs().find(x => x.id === id && x.uid === uid)
  if (!r) return Promise.reject({ msg: '需求不存在' })
  return Promise.resolve(publicReq(r))
}

const NOTICE_READ_KEY = 'wudao_notice_read'

function noticesFromReqs() {
  const uid = getUid()
  const readIds = wx.getStorageSync(NOTICE_READ_KEY) || []
  const readSet = {}
  readIds.forEach(id => { readSet[id] = true })
  const items = getReqs().filter(r => r.uid === uid && (r.status === 'published' || r.status === 'rejected'))
    .map(r => {
      const id = 'n_' + r.id + '_' + r.status
      const published = r.status === 'published'
      return {
        id,
        kind: r.status,
        title: published ? '搭子需求已发布' : '搭子需求未通过审核',
        body: published
          ? (r.title ? '「' + r.title + '」已上线，可在活动页查看' : '需求已通过审核并发布')
          : (r.rejectReason || '未通过审核'),
        requestId: r.id,
        activityId: r.linkedActivityId || '',
        read: !!readSet[id],
        createdAt: r.updatedAt || r.createdAt
      }
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  return { items, unread: items.filter(x => !x.read).length }
}

function getNotices() {
  return Promise.resolve(noticesFromReqs())
}

function markNoticeRead(id) {
  const ids = wx.getStorageSync(NOTICE_READ_KEY) || []
  if (ids.indexOf(id) === -1) {
    ids.push(id)
    wx.setStorageSync(NOTICE_READ_KEY, ids)
  }
  return Promise.resolve({ id, read: true })
}

function markAllNoticesRead() {
  const { items } = noticesFromReqs()
  wx.setStorageSync(NOTICE_READ_KEY, items.map(x => x.id))
  return Promise.resolve({ ok: true })
}

function submitFeedback(payload) {
  const db = load()
  db.feedbacks = db.feedbacks || []
  const content = String((payload && payload.content) || '').trim()
  if (!content) return Promise.reject({ msg: '请填写反馈内容' })
  const item = {
    id: genId('fb'),
    uid: getUid(),
    sourceType: (payload && payload.sourceType) || 'general',
    sourceId: (payload && payload.sourceId) || '',
    sourceTitle: (payload && payload.sourceTitle) || '',
    content,
    status: 'pending',
    statusName: '已收到',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  db.feedbacks.unshift(item)
  save(db)
  return Promise.resolve(item)
}

function getMyFeedbacks() {
  const db = load()
  const uid = getUid()
  return Promise.resolve((db.feedbacks || [])
    .filter(f => f.uid === uid)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
}

function withdrawBuddyRequest(id) {
  const uid = getUid()
  const reqs = getReqs()
  const i = reqs.findIndex(x => x.id === id && x.uid === uid && x.status === 'pending')
  if (i === -1) return Promise.reject({ msg: '仅审核中的需求可撤回' })
  reqs.splice(i, 1)
  saveReqs(reqs)
  return Promise.resolve({ withdrawn: true })
}

function closeBuddyRequest(id) {
  const uid = getUid()
  const reqs = getReqs()
  const r = reqs.find(x => x.id === id && x.uid === uid)
  if (!r || r.status !== 'published') return Promise.reject({ msg: '仅已发布的练舞局可结束' })
  r.status = 'closed'
  r.updatedAt = Date.now()
  saveReqs(reqs)
  const db = load()
  const a = db.activities.find(x => x.id === r.linkedActivityId)
  if (a) { a.buddyStatus = 'ended'; save(db) }
  return Promise.resolve({ closed: true })
}

function getBuddyApplications(id) {
  const uid = getUid()
  const r = getReqs().find(x => x.id === id && x.uid === uid)
  if (!r) return Promise.reject({ msg: '无权查看' })
  const items = getApps()
    .filter(a => a.requestId === r.id || (r.linkedActivityId && a.activityId === r.linkedActivityId))
    .map(a => ({
      id: a.id,
      message: a.message,
      contactWechat: a.contactWechat,
      contactPhone: a.contactPhone || '',
      createdAt: a.createdAt
    }))
  return Promise.resolve({ items, title: r.title })
}

function applyToBuddy(activityId, payload) {
  const db = load()
  const a = db.activities.find(x => x.id === activityId)
  if (!a || a.type !== 'buddy') return Promise.resolve({ applied: false, msg: '仅找搭子支持加入' })
  if (a.buddyStatus === 'ended') return Promise.resolve({ applied: false, msg: '该练舞局已结束' })
  const uid = getUid()
  if (a.initiatorUid === uid) return Promise.resolve({ applied: false, msg: '不能加入自己的局' })
  const wechat = String((payload && payload.contactWechat) || '').trim()
  if (!wechat) return Promise.resolve({ applied: false, msg: '请填写微信号' })
  const apps = getApps()
  if (apps.some(x => x.activityId === activityId && x.applicantUid === uid)) {
    return Promise.resolve({ applied: false, msg: '已加入过' })
  }
  apps.unshift({
    id: genId('ap'),
    activityId,
    requestId: a.sourceRequestId || '',
    applicantUid: uid,
    message: String((payload && payload.message) || '').slice(0, 100),
    contactWechat: wechat,
    contactPhone: String((payload && payload.contactPhone) || ''),
    createdAt: Date.now()
  })
  saveApps(apps)
  return Promise.resolve({ applied: true, applicationCount: apps.filter(x => x.activityId === activityId).length })
}

function uploadBuddyImage() {
  return Promise.resolve({ url: '' })
}

function formatFollowCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

function activityHeat(a) {
  const stats = a.stats || {}
  const liked = engagement.isLiked('activity', a.id) ? 1 : 0
  const collected = engagement.isCollected('activity', a.id) ? 1 : 0
  const applications = getApps().filter(x => x.activityId === a.id).length
  return Math.log1p(stats.views || a.views || 0) * 3 +
    Math.log1p(stats.likes || a.likeCount || liked) * 4 +
    Math.log1p(stats.collects || a.collectCount || collected) * 4 +
    Math.log1p(a.followCount || 0) * 2 +
    Math.log1p((a.joinCount || 0) + applications) * 2 +
    Math.log1p(a.checkinCount || 0)
}

function rankActivities(list) {
  return list.slice().sort((a, b) => {
    const aa = isActivityExpired(a) ? 0 : 1
    const ab = isActivityExpired(b) ? 0 : 1
    if (ab !== aa) return ab - aa
    const pa = a.pinned ? 1 : 0
    const pb = b.pinned ? 1 : 0
    if (pb !== pa) return pb - pa
    const hb = activityHeat(b)
    const ha = activityHeat(a)
    if (hb !== ha) return hb - ha
    return (b.createdAt || 0) - (a.createdAt || 0)
  })
}

function mixActivitiesByType(list) {
  const active = []
  const expired = []
  list.forEach(a => { (isActivityExpired(a) ? expired : active).push(a) })

  function mix(group) {
    const ranked = rankActivities(group)
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
        .sort((a, b) => activityHeat(buckets[b][0]) - activityHeat(buckets[a][0]))
      if (!types.length) break
      types.forEach(type => {
        if (buckets[type].length) out.push(buckets[type].shift())
      })
    }
    return out
  }

  return mix(active).concat(mix(expired))
}

/** 活动列表：按当前城市 + type 过滤（'' = 全部） */
function getActivities(type, options) {
  const db = load()
  options = options || {}
  const city = options.city || getCity()
  let list = db.activities.slice()
  if (type) list = list.filter(a => a.type === type)
  if (city) list = list.filter(a => String(a.city || '') === String(city))
  return (type ? rankActivities(list) : mixActivitiesByType(list)).map(enrichActivity)
}

/** 活动详情 + 记入浏览历史 */
function getActivity(id) {
  const db = load()
  const a = db.activities.find(x => x.id === id)
  if (!a) return null
  const enriched = enrichActivity(a)
  addHistory({
    id: a.id,
    kind: 'activity',
    title: a.title,
    catName: enriched.typeName || '活动',
    coverUrl: enriched.coverUrl || ''
  })
  return enriched
}

/* ================= 关注活动（PRD 4.7a） ================= */

function getFollowedIds() { return wx.getStorageSync(FOLLOWED_KEY) || [] }
function isFollowed(id) { return getFollowedIds().indexOf(id) > -1 }

/** 关注/取关切换：返回 { followed, followCount } */
function toggleFollow(id) {
  const db = load()
  const a = db.activities.find(x => x.id === id)
  if (!a) return { followed: false, followCount: 0 }
  const ids = getFollowedIds()
  const i = ids.indexOf(id)
  if (i > -1) {
    ids.splice(i, 1)
    a.followCount = Math.max(0, a.followCount - 1)
  } else {
    ids.unshift(id)
    a.followCount += 1
  }
  wx.setStorageSync(FOLLOWED_KEY, ids)
  save(db)
  return { followed: i === -1, followCount: a.followCount }
}

/** 我关注的活动（按关注时间倒序） */
function getFollowedActivities() {
  const ids = getFollowedIds()
  return ids.map(id => {
    const db = load()
    const a = db.activities.find(x => x.id === id)
    return a ? enrichActivity(a) : null
  }).filter(Boolean)
}

/* ================= 浏览历史（本地 ≤100，PRD 4.7） ================= */

function getHistory() {
  const list = wx.getStorageSync(HISTORY_KEY) || []
  return list.map(h => Object.assign({}, h, {
    timeText: relativeTime(h.at)
  }))
}

function addHistory(item) {
  const list = (wx.getStorageSync(HISTORY_KEY) || [])
    .filter(x => !(x.id === item.id && x.kind === item.kind))
  list.unshift(Object.assign({ at: Date.now() }, item))
  wx.setStorageSync(HISTORY_KEY, list.slice(0, HISTORY_MAX))
}

function clearHistory() {
  wx.removeStorageSync(HISTORY_KEY)
}

/* ================= 搜索（仅 PGC 内容，PRD 4.8） ================= */

function _hit(target, kw) {
  if (!target) return false
  return String(target).toLowerCase().indexOf(kw) > -1
}

function _search(keyword) {
  const kw = (keyword || '').trim().toLowerCase()
  if (!kw) return { keyword: '', results: [], total: 0 }
  const db = load()
  const results = db.posts
    .filter(p => _hit(p.title, kw) || _hit(p.body, kw) ||
      _hit((data.CONTENT_CATS[p.cat] || {}).name, kw))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(p => Object.assign(enrichContent(p), { kind: 'post' }))
  const acts = db.activities
    .filter(a => _hit(a.title, kw) || _hit(a.desc, kw) || _hit(a.location, kw) || _hit(a.city, kw))
    .map(a => {
      const e = enrichActivity(a)
      return Object.assign(e, {
        kind: 'activity',
        catName: a.type === 'buddy' ? '练舞局' : '活动',
        tagCls: a.type === 'buddy' ? '' : 'c3',
        hasCover: false,
        publisher: { nickname: a.organizer || '舞岛官方' },
        timeText: a.dateText || '',
        body: a.desc || '',
        images: []
      })
    })
  const all = results.concat(acts)
  return { keyword: (keyword || '').trim(), results: all, total: all.length }
}

function searchAll(keyword) {
  return _search(keyword)
}

function getHotSearches() { return data.HOT_SEARCHES.slice() }

function wrapToggle(fn, countKey) {
  return function (meta) {
    const r = fn(meta)
    const n = Number(meta[countKey]) || 0
    r[countKey] = Math.max(0, n + (r.on ? 1 : -1))
    return r
  }
}

module.exports = {
  initDB,
  // 登录（可选）
  getCurrentUser, isLoggedIn, login, logout, wxLoginCode,
  // 城市
  getCity, setCity,
  // 内容（纯浏览）
  getFeed, getPost,
  // 活动
  getActivities, getActivity, toggleFollow, getFollowedActivities, isFollowed,
  joinActivity, checkInActivity, getJoinedActivities,
  submitBuddyRequest, getMyBuddyRequests, getBuddyRequest,
  withdrawBuddyRequest, closeBuddyRequest, getBuddyApplications,
  applyToBuddy, uploadBuddyImage, getUid,
  getNotices, markNoticeRead, markAllNoticesRead,
  submitFeedback, getMyFeedbacks,
  // 浏览历史
  getHistory, clearHistory,
  isLiked: engagement.isLiked,
  isCollected: engagement.isCollected,
  toggleLike: wrapToggle(engagement.toggleLike, 'likeCount'),
  toggleCollect: wrapToggle(engagement.toggleCollect, 'collectCount'),
  getLikes: engagement.getLikes,
  getCollects: engagement.getCollects,
  // 搜索
  searchAll, searchOnly: _search, getHotSearches
}
