const api = require('../../utils/api')

Page({
  data: {
    notify: true,
    buddyNotify: true,
    loggedIn: false
  },

  onShow() {
    this.setData({
      notify: wx.getStorageSync('wudao_notify') !== false,
      buddyNotify: wx.getStorageSync('wudao_buddy_notify') !== false,
      loggedIn: api.isLoggedIn()
    })
  },

  onNotify(e) {
    const on = e.detail.value
    wx.setStorageSync('wudao_notify', on)
    this.setData({ notify: on })
    if (on) {
      wx.showToast({ title: '已开启提醒', icon: 'success' })
    }
  },

  onBuddyNotify(e) {
    const on = e.detail.value
    wx.setStorageSync('wudao_buddy_notify', on)
    this.setData({ buddyNotify: on })
  },

  goAgreement() {
    wx.navigateTo({ url: '/pages/agreement/agreement' })
  },

  goPrivacy() {
    wx.showToast({ title: '隐私政策即将上线', icon: 'none' })
  },

  onLogout() {
    if (!api.isLoggedIn()) return
    wx.showModal({
      title: '退出登录',
      content: '确定退出当前账号吗？',
      success: async res => {
        if (!res.confirm) return
        try {
          await api.logout()
          this.setData({ loggedIn: false })
          wx.showToast({ title: '已退出登录', icon: 'none' })
        } catch (e) {
          wx.showToast({ title: e.msg || '退出失败', icon: 'none' })
        }
      }
    })
  }
})
