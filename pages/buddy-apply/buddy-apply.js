const api = require('../../utils/api')

Page({
  data: { act: null, message: '', contactWechat: '', contactPhone: '', busy: false },

  onLoad(options) {
    this._id = options.id
    api.getActivity(this._id).then(act => this.setData({ act })).catch(e => {
      wx.showToast({ title: e.msg || '活动不存在', icon: 'none' })
    })
  },

  onMsg(e) { this.setData({ message: e.detail.value }) },
  onWechat(e) { this.setData({ contactWechat: e.detail.value }) },
  onPhone(e) { this.setData({ contactPhone: e.detail.value }) },

  async onSubmit() {
    if (this.data.busy) return
    if (!this.data.contactWechat.trim()) {
      wx.showToast({ title: '请填写微信号', icon: 'none' })
      return
    }
    if (!(await api.requireLogin({ tip: '登录后才能加入' }))) return
    this.setData({ busy: true })
    try {
      const r = await api.applyToBuddy(this._id, {
        message: this.data.message.trim(),
        contactWechat: this.data.contactWechat.trim(),
        contactPhone: this.data.contactPhone.trim()
      })
      if (!r.applied) {
        wx.showToast({ title: r.msg || '加入失败', icon: 'none' })
        this.setData({ busy: false })
        return
      }
      wx.showToast({ title: '已加入，等待发起人联系', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 800)
    } catch (e) {
      wx.showToast({ title: e.msg || '加入失败', icon: 'none' })
      this.setData({ busy: false })
    }
  }
})
