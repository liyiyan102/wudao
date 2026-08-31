/**
 * 舞岛（非社区版）· 接口层（页面唯一依赖点，Adapter 模式）
 * 公共本地能力：城市 / 登录引导 / 搜索历史
 */
const cfg = require('./config')

let adapter
try {
  adapter = cfg.mode === 'http'
    ? require('./adapters/http')
    : require('./adapters/local')
} catch (e) {
  console.error('[wudao] require api fail', e)
  adapter = require('./adapters/local')
}

const SEARCH_HISTORY_KEY = 'wudao_search_history'
const SEARCH_HISTORY_MAX = 10

/**
 * 关键动作前校验登录。未登录时引导去微信授权页（选头像 + 昵称）。
 * @param {{ tip?: string }} [opts]
 * @returns {Promise<boolean>}
 */
function openLoginPage() {
  return new Promise((resolve) => {
    wx.navigateTo({
      url: '/pages/login/login',
      events: {
        loggedIn: () => resolve(true),
        loginCancel: () => resolve(false)
      },
      fail: () => {
        wx.showToast({ title: '打不开登录页', icon: 'none' })
        resolve(false)
      }
    })
  })
}

function requireLogin(opts) {
  opts = opts || {}
  if (adapter.isLoggedIn()) return Promise.resolve(true)
  return new Promise((resolve) => {
    wx.showModal({
      title: '需要登录',
      content: opts.tip || '登录后才能继续操作',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) {
          resolve(false)
          return
        }
        openLoginPage().then(resolve)
      },
      fail: () => resolve(false)
    })
  })
}

function getSearchHistory() {
  return wx.getStorageSync(SEARCH_HISTORY_KEY) || []
}

function addSearchHistory(kw) {
  const word = String(kw || '').trim()
  if (!word) return getSearchHistory()
  const list = getSearchHistory().filter(x => x !== word)
  list.unshift(word)
  const next = list.slice(0, SEARCH_HISTORY_MAX)
  wx.setStorageSync(SEARCH_HISTORY_KEY, next)
  return next
}

function clearSearchHistory() {
  wx.removeStorageSync(SEARCH_HISTORY_KEY)
}

module.exports = Object.assign({}, adapter, {
  requireLogin,
  getSearchHistory, addSearchHistory, clearSearchHistory
})
