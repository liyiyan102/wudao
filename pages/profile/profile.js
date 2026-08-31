const api = require('../../utils/api')

Page({
  data: {
    user: null,
    nickInitial: '舞',
    historyCount: 0,
    likeCount: 0,
    collectCount: 0,
    myActCount: 0,
    unreadCount: 0
  },

  async onShow() {
    try {
      require('../../utils/share').enableShareMenu()
    } catch (e) {}
    const followed = await Promise.resolve(api.getFollowedActivities()).catch(() => [])
    const joined = await Promise.resolve(api.getJoinedActivities()).catch(() => [])
    const buddy = await Promise.resolve(api.getMyBuddyRequests()).catch(() => [])
    const notices = await Promise.resolve(api.getNotices()).catch(() => ({ unread: 0 }))
    const user = api.getCurrentUser()
    const name = (user && user.nickname) || '舞'
    this.setData({
      user,
      nickInitial: String(name).charAt(0),
      historyCount: api.getHistory().length,
      likeCount: api.getLikes().length,
      collectCount: api.getCollects().length,
      myActCount: followed.length + joined.length + buddy.length,
      unreadCount: (notices && notices.unread) || 0
    })
  },

  async doLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },

  async goMessages() {
    const ok = await api.requireLogin({ tip: '登录后才能查看审核消息' })
    if (!ok) return
    wx.navigateTo({ url: '/pages/messages/messages' })
  },

  goLikes() {
    wx.navigateTo({ url: '/pages/library/library?mode=likes' })
  },

  goCollects() {
    wx.navigateTo({ url: '/pages/library/library?mode=collects' })
  },

  goMyActivities() {
    wx.navigateTo({ url: '/pages/my-activities/my-activities' })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  goFeedback() {
    wx.navigateTo({ url: '/pages/feedback-submit/feedback-submit' })
  },

  onShareAppMessage() {
    const { homeShareCard } = require('../../utils/default-covers')
    return homeShareCard()
  },

  onShareTimeline() {
    const { homeShareCard } = require('../../utils/default-covers')
    const card = homeShareCard()
    return { title: card.title, query: '', imageUrl: card.imageUrl }
  }
})
