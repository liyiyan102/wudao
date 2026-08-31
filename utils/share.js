/**
 * 打开右上角「转发 / 分享到朋友圈」。
 * 自定义导航页不调用的话，胶囊菜单里经常没有分享项。
 */
function enableShareMenu() {
  try {
    if (typeof wx.showShareMenu !== 'function') return
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  } catch (e) {}
}

module.exports = { enableShareMenu }
