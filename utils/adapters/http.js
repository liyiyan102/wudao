/**
 * HTTP Adapter · 非社区版 v2（对接 server v2：内容/活动/搜索全公开 API）
 * 登录/浏览历史/关注活动 = 本地存储（与 local 模式语义一致）
 */
const cfg = require('../config')
const { relativeTime, getUid } = require('../util')
const { withDefaultCover } = require('../default-covers')
const engagement = require('../engagement')
const auth = require('../auth')

const BASE = cfg.http.baseUrl
const FOLLOWED_KEY = 'wudao_followed'
const HISTORY_KEY = 'wudao_history'

function getCity() { return wx.getStorageSync('wudao_city') || '北京' }
function setCity(c) { wx.setStorageSync('wudao_city', c) }

function request(path, options) {
  options = options || {}
  const method = (options.method || 'GET').toUpperCase()
  const header = {}
  if (method !== 'GET' && method !== 'HEAD') {
    header['Content-Type'] = 'application/json'
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE + path,
      method,
      data: options.data,
      header,
      timeout: 8000,
      success: res => {
        const body = res.data
        if (body && body.code === 0) resolve(body.data)
        else {
          console.error('[wudao] api err', path, body)
          reject(body || { code: 500, msg: '服务异常' })
        }
      },
      fail: err => {
        console.error('[wudao] api fail', path, BASE, err)
        const isLocal = /127\.0\.0\.1|localhost|192\.168\.|10\./.test(BASE)
        reject({
          code: -1,
          msg: isLocal
            ? '连不上本地后端，请确认已启动 server'
            : '网络异常，请检查网络或稍后重试'
        })
      }
    })
  })
}

function initDB() { return Promise.resolve() }

/* ============ 登录（微信头像 + 昵称） ============ */
const getCurrentUser = auth.getCurrentUser
const isLoggedIn = auth.isLoggedIn
const login = auth.login
const logout = auth.logout
const wxLoginCode = auth.wxLoginCode

/* ============ 内容 ============ */
async function getFeed(scope) {
  // scope = discover | city | culture/outfit/fresh（分类 tab）
  // 始终带上城市，供服务端非置顶推荐（同城加权）
  let data = { city: getCity() }
  if (scope === 'city') data.scope = 'city'
  else if (scope && scope !== 'discover') data.tab = scope
  const d = await request('/api/content/feed', { data })
  return (d && d.items) || []
}

function getPost(id) {
  return request('/api/content/posts/' + id).then(p => {
    addHistory({ id: p.id, kind: 'post', title: p.title, catName: p.catName, coverUrl: p.coverUrl || (p.images && p.images[0]) || '' })
    return p
  })
}

/* ============ 活动 ============ */
async function getActivities(type, options) {
  options = options || {}
  const d = await request('/api/activities', {
    data: {
      type: type || '',
      city: options.city || getCity(),
      uid: getUid()
    }
  })
  return (d.items || []).map(withDefaultCover)
}

function getActivity(id) {
  return request('/api/activities/' + id, { data: { uid: getUid() } }).then(a => {
    const act = withDefaultCover(a)
    addHistory({
      id: act.id,
      kind: 'activity',
      title: act.title,
      catName: act.typeName || (act.type === 'buddy' ? '找搭子' : '活动'),
      coverUrl: act.coverUrl || ''
    })
    return act
  })
}

function getFollowedIds() { return wx.getStorageSync(FOLLOWED_KEY) || [] }

async function toggleFollow(id) {
  const ids = getFollowedIds()
  const i = ids.indexOf(id)
  let act
  try { act = await getActivity(id) } catch (e) { return { followed: false, followCount: 0 } }
  if (i > -1) {
    ids.splice(i, 1)
    wx.setStorageSync(FOLLOWED_KEY, ids)
    return { followed: false, followCount: Math.max(0, (act.followCount || 1) - 1) }
  }
  ids.unshift(id)
  wx.setStorageSync(FOLLOWED_KEY, ids)
  return { followed: true, followCount: (act.followCount || 0) + 1 }
}

async function getFollowedActivities() {
  const ids = getFollowedIds()
  const list = []
  for (const id of ids) {
    try { list.push(await getActivity(id)) } catch (e) { /* 已删除 */ }
  }
  return list.map(a => Object.assign({}, a, { followed: true }))
}

function isFollowed(id) {
  return Promise.resolve(getFollowedIds().indexOf(id) > -1)
}

/* ============ 加入官方活动 & 打卡（服务端存记录，匿名 UID） ============ */
async function joinActivity(id) {
  return request('/api/activities/' + id + '/join', { method: 'POST', data: { uid: getUid() } })
    .catch(e => ({ joined: false, joinCount: 0, msg: e.msg || '网络异常' }))
}

async function checkInActivity(id) {
  return request('/api/activities/' + id + '/checkin', { method: 'POST', data: { uid: getUid() } })
    .catch(e => ({ checkedIn: false, checkinCount: 0, msg: e.msg || '网络异常' }))
}

async function getJoinedActivities() {
  const d = await request('/api/activities/joined', { data: { uid: getUid() } })
  return (d.items || []).map(withDefaultCover)
}

/* ============ 代发撮合 ============ */
function submitBuddyRequest(payload) {
  return request('/api/buddy/requests', {
    method: 'POST',
    data: Object.assign({ uid: getUid() }, payload)
  })
}

function getMyBuddyRequests() {
  return request('/api/buddy/requests', { data: { uid: getUid() } }).then(d => d.items || [])
}

function getBuddyRequest(id) {
  return request('/api/buddy/requests/' + id, { data: { uid: getUid() } })
}

function withdrawBuddyRequest(id) {
  return request('/api/buddy/requests/' + id + '/withdraw', { method: 'POST', data: { uid: getUid() } })
}

function closeBuddyRequest(id) {
  return request('/api/buddy/requests/' + id + '/close', { method: 'POST', data: { uid: getUid() } })
}

function getBuddyApplications(id) {
  return request('/api/buddy/requests/' + id + '/applications', { data: { uid: getUid() } })
}

function getNotices() {
  return request('/api/buddy/notices', { data: { uid: getUid() } }).then(d => ({
    items: d.items || [],
    unread: d.unread || 0
  })).catch(() => ({ items: [], unread: 0 }))
}

function markNoticeRead(id) {
  return request('/api/buddy/notices/' + id + '/read', { method: 'POST', data: { uid: getUid() } })
}

function markAllNoticesRead() {
  return request('/api/buddy/notices/read-all', { method: 'POST', data: { uid: getUid() } })
}

function submitFeedback(payload) {
  return request('/api/feedback', {
    method: 'POST',
    data: Object.assign({ uid: getUid() }, payload)
  })
}

function getMyFeedbacks() {
  return request('/api/feedback', { data: { uid: getUid() } }).then(d => (d && d.items) || [])
}

function applyToBuddy(activityId, payload) {
  return request('/api/activities/' + activityId + '/apply', {
    method: 'POST',
    data: Object.assign({ uid: getUid() }, payload)
  }).catch(e => ({ applied: false, applicationCount: 0, msg: e.msg || '网络异常' }))
}

function uploadBuddyImage(filePath) {
  const BASE = cfg.http.baseUrl
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: BASE + '/api/buddy/upload',
      filePath,
      name: 'file',
      success: res => {
        try {
          const d = JSON.parse(res.data)
          if (d.code === 0) resolve(d.data)
          else reject(d)
        } catch (e) { reject({ msg: '上传失败' }) }
      },
      fail: () => reject({ msg: '上传失败' })
    })
  })
}

/* ============ 浏览历史（本地） ============ */
function getHistory() {
  return (wx.getStorageSync(HISTORY_KEY) || []).map(h => Object.assign({}, h, {
    timeText: relativeTime(h.at)
  }))
}

function addHistory(item) {
  const list = (wx.getStorageSync(HISTORY_KEY) || [])
    .filter(x => !(x.id === item.id && x.kind === item.kind))
  list.unshift(Object.assign({ at: Date.now() }, item))
  wx.setStorageSync(HISTORY_KEY, list.slice(0, 100))
}

function clearHistory() { wx.removeStorageSync(HISTORY_KEY) }

/* ============ 搜索 ============ */
async function searchAll(keyword) {
  return request('/api/search', { data: { q: (keyword || '').trim() } })
}

async function searchOnly(keyword) { return searchAll(keyword) }

function getHotSearches() { return request('/api/search/hot') }

function bumpCount(n, on) {
  n = Number(n) || 0
  return Math.max(0, n + (on ? 1 : -1))
}

function toggleLike(meta) {
  const r = engagement.toggleLike(meta)
  r.likeCount = bumpCount(meta.likeCount, r.on)
  request('/api/engage', {
    method: 'POST',
    data: { uid: getUid(), kind: meta.kind, id: meta.id, action: 'like', on: r.on }
  }).then(d => {
    if (d && typeof d.likeCount === 'number') r.likeCount = d.likeCount
  }).catch(() => {})
  return r
}

function toggleCollect(meta) {
  const r = engagement.toggleCollect(meta)
  r.collectCount = bumpCount(meta.collectCount, r.on)
  request('/api/engage', {
    method: 'POST',
    data: { uid: getUid(), kind: meta.kind, id: meta.id, action: 'collect', on: r.on }
  }).then(d => {
    if (d && typeof d.collectCount === 'number') r.collectCount = d.collectCount
  }).catch(() => {})
  return r
}

module.exports = {
  initDB,
  getCurrentUser, isLoggedIn, login, logout, wxLoginCode,
  getCity, setCity,
  getFeed, getPost,
  getActivities, getActivity, toggleFollow, getFollowedActivities, isFollowed,
  joinActivity, checkInActivity, getJoinedActivities,
  submitBuddyRequest, getMyBuddyRequests, getBuddyRequest,
  withdrawBuddyRequest, closeBuddyRequest, getBuddyApplications,
  applyToBuddy, uploadBuddyImage, getUid,
  getNotices, markNoticeRead, markAllNoticesRead,
  submitFeedback, getMyFeedbacks,
  getHistory, addHistory, clearHistory,
  isLiked: engagement.isLiked,
  isCollected: engagement.isCollected,
  toggleLike,
  toggleCollect,
  getLikes: engagement.getLikes,
  getCollects: engagement.getCollects,
  searchAll, searchOnly, getHotSearches
}
