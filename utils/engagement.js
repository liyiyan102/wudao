/**
 * 点赞 / 收藏（本地持久化，内容与活动共用）
 * item: { id, kind: 'post'|'activity', title, catName, coverUrl?, at }
 */
const LIKES_KEY = 'wudao_likes'
const COLLECTS_KEY = 'wudao_collects'

function _load(key) {
  return wx.getStorageSync(key) || []
}
function _save(key, list) {
  wx.setStorageSync(key, list.slice(0, 200))
}

function _toggle(key, meta) {
  const list = _load(key)
  const i = list.findIndex(x => x.id === meta.id && x.kind === meta.kind)
  let on
  if (i > -1) {
    list.splice(i, 1)
    on = false
  } else {
    list.unshift({
      id: meta.id,
      kind: meta.kind,
      title: meta.title || '',
      catName: meta.catName || '',
      coverUrl: meta.coverUrl || '',
      at: Date.now()
    })
    on = true
  }
  _save(key, list)
  return { on, count: list.length }
}

function isLiked(kind, id) {
  return _load(LIKES_KEY).some(x => x.id === id && x.kind === kind)
}
function isCollected(kind, id) {
  return _load(COLLECTS_KEY).some(x => x.id === id && x.kind === kind)
}
function toggleLike(meta) {
  return _toggle(LIKES_KEY, meta)
}
function toggleCollect(meta) {
  return _toggle(COLLECTS_KEY, meta)
}
function getLikes() {
  return _load(LIKES_KEY).map(decorate)
}
function getCollects() {
  return _load(COLLECTS_KEY).map(decorate)
}

function decorate(item) {
  const d = new Date(item.at || Date.now())
  const timeText = (d.getMonth() + 1) + '月' + d.getDate() + '日'
  return Object.assign({}, item, { timeText })
}

module.exports = {
  isLiked, isCollected, toggleLike, toggleCollect, getLikes, getCollects
}
