const api = require('../../utils/api')
const { relativeTime } = require('../../utils/util')

function mapItem(n) {
  const published = n.kind === 'published'
  return Object.assign({}, n, {
    kindName: published ? '已发布' : '未通过',
    timeText: relativeTime(n.createdAt),
    hint: published ? '查看活动 →' : '查看我的需求 →'
  })
}

Page({
  data: { list: [] },

  onShow() {
    this.load()
  },

  async load() {
    try {
      const d = await api.getNotices()
      const items = (d && d.items) || []
      this.setData({ list: items.map(mapItem) })
      if (items.length) api.markAllNoticesRead().catch(() => {})
    } catch (e) {
      wx.showToast({ title: (e && e.msg) || '加载失败', icon: 'none' })
    }
  },

  onOpen(e) {
    const item = e.currentTarget.dataset.item || {}
    api.markNoticeRead(item.id).catch(() => {})
    if (item.kind === 'published' && item.activityId) {
      wx.navigateTo({ url: '/pages/activity-detail/activity-detail?id=' + item.activityId })
      return
    }
    wx.navigateTo({ url: '/pages/my-activities/my-activities?tab=buddy' })
  }
})
