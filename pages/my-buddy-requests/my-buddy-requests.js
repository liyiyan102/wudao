const api = require('../../utils/api')
const { BUDDY_REQUEST_STATUS } = require('../../utils/data')
const { relativeTime } = require('../../utils/util')

Page({
  data: { list: [] },

  onShow() { this.load() },

  async load() {
    try {
      const items = await api.getMyBuddyRequests()
      this.setData({
        list: items.map(r => {
          const bits = [r.subTypeName]
          if (r.dateText) bits.push(r.dateText)
          if (r.location) bits.push(r.location)
          return Object.assign({}, r, {
            statusName: (BUDDY_REQUEST_STATUS[r.status] || {}).name || r.status,
            timeText: relativeTime(r.createdAt),
            metaLine: bits.join(' · ')
          })
        })
      })
    } catch (e) {
      wx.showToast({ title: e.msg || '加载失败', icon: 'none' })
    }
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

  async goNew() {
    if (!(await api.requireLogin({ tip: '登录后才能发布找搭子' }))) return
    wx.navigateTo({ url: '/pages/buddy-request/buddy-request' })
  }
})
