const api = require('../../utils/api')

Page({
  data: {
    avatar: '',
    nickname: '',
    agreed: false,
    privacyAuthorized: false,
    saving: false,
    done: false
  },

  onLoad() {},

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

  toggleAgree() {
    const agreed = !this.data.agreed
    this.setData({ agreed })
  },

  onAvatarTap() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先勾选并阅读协议', icon: 'none' })
      return
    }
  },

  requireAgreed() {
    if (this.data.agreed) return true
    wx.showToast({ title: '请先阅读并同意协议与隐私政策', icon: 'none' })
    return false
  },

  onPrivacyAgree() {
    this.setData({ privacyAuthorized: true })
    api.wxLoginCode().catch(() => {})
  },

  onGetUserInfo(e) {
    if (!this.requireAgreed()) return
    const userInfo = (e.detail && e.detail.userInfo) || {}
    const avatar = userInfo.avatarUrl || ''
    const nickname = userInfo.nickName || ''
    if (!avatar) {
      wx.showToast({ title: '未获取到头像，请重试', icon: 'none' })
      return
    }
    this.setData({
      avatar,
      nickname: nickname || this.data.nickname
    })
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

  goPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' })
  },

  async onSubmit() {
    const nickname = String(this.data.nickname || '').trim()
    if (!this.requireAgreed()) return
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
