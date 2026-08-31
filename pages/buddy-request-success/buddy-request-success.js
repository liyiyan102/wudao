Page({
  goMine() {
    wx.redirectTo({ url: '/pages/my-activities/my-activities?tab=buddy' })
  },
  goActs() {
    wx.switchTab({ url: '/pages/activities/activities' })
  }
})
