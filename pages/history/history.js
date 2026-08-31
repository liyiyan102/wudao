const api = require('../../utils/api')

Page({
  data: { list: [] },

  onShow() {
    this.setData({ list: api.getHistory() })
  },

  onClear() {
    wx.showModal({
      title: '清空浏览历史',
      content: '将删除全部浏览记录，确定吗？',
      confirmColor: '#FA5151',
      success: res => {
        if (res.confirm) {
          api.clearHistory()
          this.setData({ list: [] })
        }
      }
    })
  },

  openItem(e) {
    const item = e.currentTarget.dataset.item
    const url = item.kind === 'activity'
      ? '/pages/activity-detail/activity-detail?id=' + item.id
      : '/pages/post-detail/post-detail?id=' + item.id
    wx.navigateTo({ url })
  }
})
