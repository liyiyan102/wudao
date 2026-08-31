const api = require('../../utils/api')
const { relativeTime } = require('../../utils/util')

Page({
  data: { items: [], title: '' },

  onLoad(options) {
    this._id = options.id
  },

  onShow() { this.load() },

  async load() {
    try {
      const d = await api.getBuddyApplications(this._id)
      wx.setNavigationBarTitle({ title: d.title ? '加入 · ' + d.title : '加入列表' })
      this.setData({
        title: d.title || '',
        items: (d.items || []).map(a => Object.assign({}, a, { timeText: relativeTime(a.createdAt) }))
      })
    } catch (e) {
      wx.showToast({ title: e.msg || '无权查看', icon: 'none' })
    }
  },

  copy(e) {
    const text = e.currentTarget.dataset.text
    wx.setClipboardData({ data: String(text || '') })
  }
})
