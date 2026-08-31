const api = require('../../utils/api')

const SOURCE_LABEL = {
  general: '功能反馈',
  post: '帖子反馈',
  activity: '活动反馈'
}

Page({
  data: {
    sourceType: 'general',
    sourceId: '',
    sourceTitle: '',
    sourceLabel: SOURCE_LABEL.general,
    content: '',
    submitting: false
  },

  onLoad(options) {
    const sourceType = SOURCE_LABEL[options.sourceType] ? options.sourceType : 'general'
    const sourceTitle = decodeURIComponent(options.sourceTitle || '')
    this.setData({
      sourceType,
      sourceId: options.sourceId || '',
      sourceTitle,
      sourceLabel: SOURCE_LABEL[sourceType]
    })
  },

  goMyFeedback() {
    wx.navigateTo({ url: '/pages/my-feedback/my-feedback' })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  async onSubmit() {
    const content = String(this.data.content || '').trim()
    if (!content) {
      wx.showToast({ title: '请填写反馈内容', icon: 'none' })
      return
    }
    const ok = await api.requireLogin({ tip: '登录后才能提交反馈' })
    if (!ok) return
    this.setData({ submitting: true })
    try {
      await api.submitFeedback({
        sourceType: this.data.sourceType,
        sourceId: this.data.sourceId,
        sourceTitle: this.data.sourceTitle,
        content
      })
      this.setData({ content: '', submitting: false })
      wx.showToast({ title: '已提交', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: (e && e.msg) || '提交失败', icon: 'none' })
      this.setData({ submitting: false })
    }
  }
})
