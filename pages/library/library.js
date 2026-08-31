const api = require('../../utils/api')

const TITLES = {
  likes: '我的点赞',
  collects: '我的收藏'
}

Page({
  data: {
    mode: 'likes',
    list: [],
    emptyText: ''
  },

  onLoad(options) {
    const mode = options.mode === 'collects' ? 'collects' : 'likes'
    this._mode = mode
    wx.setNavigationBarTitle({ title: TITLES[mode] })
    this.setData({
      mode,
      emptyText: mode === 'likes' ? '还没有点赞内容' : '还没有收藏内容'
    })
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const list = this._mode === 'collects' ? api.getCollects() : api.getLikes()
    this.setData({ list })
  },

  openItem(e) {
    const item = e.currentTarget.dataset.item
    const url = item.kind === 'activity'
      ? '/pages/activity-detail/activity-detail?id=' + item.id
      : '/pages/post-detail/post-detail?id=' + item.id
    wx.navigateTo({ url })
  }
})
