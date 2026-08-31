const { isActivityExpired } = require('../../utils/util')
const { withDefaultCover, DEFAULT_COVERS } = require('../../utils/default-covers')
const { ACTIVITY_FILTERS } = require('../../utils/data')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    capsuleRight: 96,
    filters: ACTIVITY_FILTERS,
    typeFilter: '',
    city: '北京',
    activities: []
  },

  onLoad() {
    this.layoutNav()
  },

  /** 顶栏高度对齐胶囊，搜索框落在原生导航位置 */
  layoutNav() {
    try {
      const win = (wx.getWindowInfo && wx.getWindowInfo()) || wx.getSystemInfoSync()
      const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
      let statusBarHeight = (win && win.statusBarHeight) || 20
      let navBarHeight = 44
      let capsuleRight = 96
      if (menu && menu.height) {
        const gap = Math.max(0, menu.top - statusBarHeight)
        navBarHeight = menu.height + gap * 2
        if (win && win.windowWidth) {
          capsuleRight = Math.max(80, win.windowWidth - menu.left + 6)
        }
      }
      this.setData({ statusBarHeight, navBarHeight, capsuleRight })
    } catch (e) {
      this.setData({ statusBarHeight: 20, navBarHeight: 44, capsuleRight: 96 })
    }
  },

  onShow() {
    try {
      require('../../utils/share').enableShareMenu()
    } catch (e) {}
    try {
      const api = require('../../utils/api')
      this.setData({ city: api.getCity() || '北京' })
    } catch (e) { /* ignore */ }
    this.load()
  },

  async load() {
    try {
      const api = require('../../utils/api')
      const list = await api.getActivities(this.data.typeFilter, { city: this.data.city })
      this.setData({ activities: (list || []).map(decorateCard) })
    } catch (e) {
      console.error('[wudao] activities load fail', e)
      wx.showToast({ title: e.msg || '加载失败', icon: 'none' })
    }
  },

  onFilter(e) {
    this.setData({ typeFilter: e.currentTarget.dataset.type })
    this.load()
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/search?from=activity' })
  },

  goCityPick() {
    wx.navigateTo({ url: '/pages/city-pick/city-pick' })
  },

  openActivity(e) {
    wx.navigateTo({
      url: '/pages/activity-detail/activity-detail?id=' + e.currentTarget.dataset.id
    })
  },

  async goBuddyRequest() {
    try {
      const api = require('../../utils/api')
      if (!(await api.requireLogin({ tip: '登录后才能发布找搭子' }))) return
      wx.navigateTo({ url: '/pages/buddy-request/buddy-request' })
    } catch (e) {
      wx.showToast({ title: '暂时无法发布', icon: 'none' })
    }
  },

  onShareAppMessage() {
    return {
      title: '舞岛活动 · 官方课、赛事和找搭子',
      path: '/pages/activities/activities',
      imageUrl: BRAND_SHARE_COVER
    }
  },

  onShareTimeline() {
    return {
      title: '舞岛活动 · 官方课、赛事和找搭子',
      query: '',
      imageUrl: BRAND_SHARE_COVER
    }
  }
})

function decorateCard(a) {
  const out = withDefaultCover(Object.assign({}, a))
  out.expired = isActivityExpired(a)
  const timeLine = a.timeLabel || a.timeText || a.dateText || ''
  out.timeLine = timeLine === '时间待定' ? '' : timeLine
  out.showDate = a.dateText && a.dateText !== timeLine
  if (a.type !== 'buddy') return out
  const need = parseNeed(a.headcount)
  const got = a.applicationCount || 0
  const left = need > 0 ? Math.max(0, need - got) : -1

  if (a.buddySubType === 'group' && need > 0) {
    out.peopleTone = 'tone-group'
    if (left > 0) {
      out.peoplePrefix = '还差 '
      out.peopleNum = left
      out.peopleSuffix = ' 人成团 · 代发'
    } else {
      out.peoplePrefix = '已满员 · 代发'
      out.peopleNum = null
      out.peopleSuffix = ''
    }
  } else if (a.buddySubType === 'teammate' && need > 0) {
    out.peopleTone = 'tone-team'
    if (left > 0) {
      out.peoplePrefix = '还差 '
      out.peopleNum = left
      out.peopleSuffix = ' 人 · 代发'
    } else {
      out.peoplePrefix = '已满员 · 代发'
      out.peopleNum = null
      out.peopleSuffix = ''
    }
  }
  return out
}

function parseNeed(headcount) {
  const n = parseInt(String(headcount || '').replace(/[^\d]/g, ''), 10)
  return n > 0 ? n : 0
}
