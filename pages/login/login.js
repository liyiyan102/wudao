const api = require('../../utils/api')

Page({
  data: {
    avatar: '',
    nickname: '',
    saving: false,
    done: false
  },

  onLoad() {
    api.wxLoginCode().catch(() => {})
  },

  onUnload() {
    if (this.data.done) return
    this.emit('loginCancel')
  },

  emit(name, payload) {
    try {
      const ch = this.getOpenerEventChannel && this.getOpenerEventChannel()
      if (ch && ch.emit) ch.emit(name, payload || {})
    } catch (e) {}
  },

  onChooseAvatar(e) {
    const avatar = (e.detail && e.detail.avatarUrl) || ''
    this.setData({ avatar })
  },

  onNickInput(e) {
    this.setData({ nickname: (e.detail && e.detail.value) || '' })
  },

  onNickChange(e) {
    this.setData({ nickname: (e.detail && e.detail.value) || '' })
  },

  onNickBlur(e) {
    this.setData({ nickname: (e.detail && e.detail.value) || this.data.nickname })
  },

  onNickReview(e) {
    const pass = e.detail && (e.detail.pass || e.detail.nickname)
    if (typeof pass === 'string') this.setData({ nickname: pass })
  },

  goAgreement() {
    wx.navigateTo({ url: '/pages/agreement/agreement' })
  },

  async onSubmit() {
    const nickname = String(this.data.nickname || '').trim()
    if (!this.data.avatar) {
      wx.showToast({ title: '请选择微信头像', icon: 'none' })
      return
    }
    if (!nickname) {
      wx.showToast({ title: '请选择微信昵称', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    try {
      const user = await api.login({ nickname, avatar: this.data.avatar })
      this.setData({ done: true, saving: false })
      this.emit('loggedIn', user)
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 400)
    } catch (e) {
      this.setData({ saving: false })
      wx.showToast({ title: (e && e.msg) || '登录失败', icon: 'none' })
    }
  }
})
