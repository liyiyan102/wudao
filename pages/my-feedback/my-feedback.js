const api = require('../../utils/api')
const { relativeTime } = require('../../utils/util')

function mapItem(item) {
  return Object.assign({}, item, {
    timeText: relativeTime(item.createdAt),
    statusName: item.statusName || (item.status === 'resolved' ? '已处理' : '已收到'),
    sourceName: item.sourceName || ({
      post: '帖子反馈',
      activity: '活动反馈',
      general: '功能反馈'
    }[item.sourceType] || '功能反馈')
  })
}

Page({
  data: {
    list: [],
    loading: false
  },

  onShow() {
    this.load()
  },

  async load() {
    const ok = await api.requireLogin({ tip: '登录后才能查看我的反馈' })
    if (!ok) return
    this.setData({ loading: true })
    try {
      const items = await api.getMyFeedbacks()
      this.setData({ list: (items || []).map(mapItem) })
    } catch (e) {
      wx.showToast({ title: (e && e.msg) || '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  goSubmit() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }
    wx.redirectTo({ url: '/pages/feedback-submit/feedback-submit' })
  }
})
