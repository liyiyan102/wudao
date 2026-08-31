const api = require('../../utils/api')
const { isActivityExpired } = require('../../utils/util')
const { withDefaultCover, shareCardForActivity } = require('../../utils/default-covers')

function splitBlocks(text) {
  return String(text || '')
    .split(/\n+/)
    .map(s => s.trim())
    .filter(Boolean)
}

function buildMetaRows(act) {
  const rows = []
  const time = act.timeLabel || act.dateText
  if (time && time !== '时间待定') rows.push({ label: '时间', value: time })
  const place = act.location || act.city
  if (place) rows.push({ label: '地点', value: place })
  if (act.type !== 'buddy' && act.organizer) {
    rows.push({ label: '发布人', value: act.organizer })
  }
  if (act.danceTypes) rows.push({ label: '舞种', value: act.danceTypes })
  if (act.type === 'buddy' && act.buddySubType === 'teammate' && act.contestName) {
    rows.push({ label: '比赛', value: act.contestName })
  }
  if (act.type === 'buddy' && act.headcount) {
    rows.push({ label: '人数', value: act.headcount })
  }
  return rows
}

function decorateActivity(act) {
  const base = withDefaultCover(Object.assign({}, act))
  return Object.assign(base, {
    expired: isActivityExpired(base),
    metaRows: buildMetaRows(base),
    descBlocks: splitBlocks(base.desc),
    notesBlocks: splitBlocks(base.notes)
  })
}

Page({
  data: { act: null, liked: false, collected: false, likeCount: 0, collectCount: 0 },

  onLoad(options) {
    this._id = options.id
  },

  onShow() {
    try {
      require('../../utils/share').enableShareMenu()
    } catch (e) {}
    this.load()
  },

  async load() {
    try {
      const act = decorateActivity(await api.getActivity(this._id))
      this.setData({
        act,
        liked: api.isLiked('activity', this._id),
        collected: api.isCollected('activity', this._id),
        likeCount: act.likeCount || 0,
        collectCount: act.collectCount || 0
      })
    } catch (e) {
      wx.showToast({ title: e.msg || '加载失败', icon: 'none' })
    }
  },

  async onLike() {
    const act = this.data.act
    if (!act) return
    if (!(await api.requireLogin({ tip: '登录后才能点赞' }))) return
    const r = api.toggleLike({
      id: act.id, kind: 'activity', title: act.title, type: act.type,
      catName: act.typeName || '活动', coverUrl: act.coverUrl || '',
      likeCount: this.data.likeCount
    })
    this.setData({ liked: r.on, likeCount: r.likeCount != null ? r.likeCount : this.data.likeCount })
    wx.showToast({ title: r.on ? '已点赞' : '已取消点赞', icon: 'none' })
  },

  async onCollect() {
    const act = this.data.act
    if (!act) return
    if (!(await api.requireLogin({ tip: '登录后才能收藏' }))) return
    const r = api.toggleCollect({
      id: act.id, kind: 'activity', title: act.title, type: act.type,
      catName: act.typeName || '活动', coverUrl: act.coverUrl || '',
      collectCount: this.data.collectCount
    })
    this.setData({ collected: r.on, collectCount: r.collectCount != null ? r.collectCount : this.data.collectCount })
    wx.showToast({ title: r.on ? '已收藏' : '已取消收藏', icon: 'none' })
  },

  /** 关注活动：请求订阅消息授权（PRD 4.4：赛前 3 天/1 天推送提醒） */
  onFollow() {
    const act = this.data.act
    if (!act || act.expired) return
    if (act.followed) {
      this.applyFollow(api.toggleFollow(act.id))
      return
    }
    wx.requestSubscribeMessage({
      tmplIds: [],
      complete: () => this.applyFollow(api.toggleFollow(act.id))
    })
  },

  /** 加入官方活动 */
  async onJoin() {
    const act = this.data.act
    if (!act || act.expired) return
    if (!(await api.requireLogin({ tip: '登录后才能报名' }))) return
    try {
      const r = await api.joinActivity(act.id)
      if (!r.joined) {
        wx.showToast({ title: r.msg || '加入失败', icon: 'none' })
        return
      }
      this.setData({ act: decorateActivity(Object.assign({}, act, { joined: true, joinCount: r.joinCount })) })
      wx.showToast({ title: '报名成功', icon: 'none' })
    } catch (e) {
      wx.showToast({ title: e.msg || '加入失败', icon: 'none' })
    }
  },

  /** 现场打卡（加入后） */
  async onCheckIn() {
    const act = this.data.act
    if (!act || !act.joined) return
    try {
      const r = await api.checkInActivity(act.id)
      if (!r.checkedIn) {
        wx.showToast({ title: r.msg || '打卡失败', icon: 'none' })
        return
      }
      this.setData({
        act: decorateActivity(Object.assign({}, act, {
          checkedIn: true,
          checkinAt: Date.now(),
          checkinCount: r.checkinCount
        }))
      })
      wx.showToast({ title: '打卡成功！', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: e.msg || '打卡失败', icon: 'none' })
    }
  },

  applyFollow(promise) {
    promise.then(res => {
      const act = decorateActivity(Object.assign({}, this.data.act, {
        followed: res.followed,
        followCount: res.followCount,
        followText: res.followCount >= 1000
          ? (res.followCount / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
          : String(res.followCount)
      }))
      this.setData({ act })
      wx.showToast({
        title: res.followed ? '已报名' : '已取消报名',
        icon: 'none'
      })
    }).catch(() => {})
  },

  async onWantJoin() {
    const act = this.data.act
    if (!act || act.expired) return
    if (!(await api.requireLogin({ tip: '登录后才能加入' }))) return
    wx.navigateTo({ url: '/pages/buddy-apply/buddy-apply?id=' + act.id })
  },

  goMyRequest() {
    const act = this.data.act
    if (act && act.sourceRequestId) {
      wx.navigateTo({ url: '/pages/buddy-applications/buddy-applications?id=' + act.sourceRequestId })
      return
    }
    wx.navigateTo({ url: '/pages/my-activities/my-activities?tab=buddy' })
  },

  goFeedback() {
    const act = this.data.act
    if (!act) return
    wx.navigateTo({
      url: '/pages/feedback-submit/feedback-submit?sourceType=activity&sourceId=' +
        encodeURIComponent(act.id) + '&sourceTitle=' + encodeURIComponent(act.title || '')
    })
  },

  onShareAppMessage() {
    return shareCardForActivity(this.data.act)
  },

  onShareTimeline() {
    const card = shareCardForActivity(this.data.act)
    return {
      title: card.title,
      query: 'id=' + (this._id || ''),
      imageUrl: card.imageUrl
    }
  }
})
