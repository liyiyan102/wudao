const api = require('../../utils/api')
const { BUDDY_REQUEST_STATUS } = require('../../utils/data')
const { relativeTime } = require('../../utils/util')

Page({
  data: {
    tab: 'followed', // followed | joined | buddy
    list: [],
    buddyList: []
  },

  onLoad(options) {
    if (options && options.tab && ['followed', 'joined', 'buddy'].indexOf(options.tab) > -1) {
      this.setData({ tab: options.tab })
    }
  },

  onShow() {
    this.load()
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.tab) return
    this.setData({ tab })
    this.load()
  },

  async load() {
    const tab = this.data.tab
    try {
      if (tab === 'buddy') {
        const items = await api.getMyBuddyRequests()
        this.setData({
          buddyList: (items || []).map(r => {
            const bits = [r.subTypeName]
            if (r.dateText) bits.push(r.dateText)
            if (r.location) bits.push(r.location)
            return Object.assign({}, r, {
              statusName: (BUDDY_REQUEST_STATUS[r.status] || {}).name || r.status,
              timeText: relativeTime(r.createdAt),
              metaLine: bits.join(' · ')
            })
          }),
          list: []
        })
        return
      }
      const list = tab === 'joined'
        ? await api.getJoinedActivities()
        : await api.getFollowedActivities()
      this.setData({ list: list || [], buddyList: [] })
    } catch (e) {
      wx.showToast({ title: e.msg || '加载失败', icon: 'none' })
    }
  },

  onUnfollow(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消关注',
      content: '取消后将不再收到该活动的提醒，确定吗？',
      confirmColor: '#FA5151',
      success: res => {
        if (res.confirm) {
          api.toggleFollow(id)
          this.load()
        }
      }
    })
  },

  onJoinCancel(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消加入',
      content: '取消后打卡记录也会清除，确定吗？',
      confirmColor: '#FA5151',
      success: res => {
        if (res.confirm) {
          wx.setStorageSync('wudao_joins', api.getJoinedActivities()
            .filter(a => a.id !== id)
            .map(a => ({ id: a.id, at: Date.now(), checkinAt: a.checkinAt || 0 })))
          this.load()
        }
      }
    })
  },

  onWithdraw(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '撤回需求',
      content: '撤回后需重新提交。确定吗？',
      success: async res => {
        if (!res.confirm) return
        try {
          await api.withdrawBuddyRequest(id)
          this.load()
        } catch (err) {
          wx.showToast({ title: err.msg || '撤回失败', icon: 'none' })
        }
      }
    })
  },

  async onRetry(e) {
    if (!(await api.requireLogin({ tip: '登录后才能发布找搭子' }))) return
    wx.navigateTo({ url: '/pages/buddy-request/buddy-request?prefill=' + e.currentTarget.dataset.id })
  },

  onApps(e) {
    wx.navigateTo({ url: '/pages/buddy-applications/buddy-applications?id=' + e.currentTarget.dataset.id })
  },

  onOpen(e) {
    wx.navigateTo({ url: '/pages/activity-detail/activity-detail?id=' + e.currentTarget.dataset.id })
  },

  onShare(e) {
    wx.navigateTo({ url: '/pages/activity-detail/activity-detail?id=' + e.currentTarget.dataset.id })
  },

  onClose(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '标记已结束',
      content: '结束后将停止接受加入。',
      success: async res => {
        if (!res.confirm) return
        try {
          await api.closeBuddyRequest(id)
          this.load()
        } catch (err) {
          wx.showToast({ title: err.msg || '操作失败', icon: 'none' })
        }
      }
    })
  },

  goBuddyNew() {
    wx.switchTab({ url: '/pages/activities/activities' })
  },

  openActivity(e) {
    wx.navigateTo({
      url: '/pages/activity-detail/activity-detail?id=' + e.currentTarget.dataset.id
    })
  }
})
