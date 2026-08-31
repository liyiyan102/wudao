const api = require('../../utils/api')
const cfg = require('../../utils/config')
const { parseMarkdown } = require('../../utils/md')
const { shareCardForPost } = require('../../utils/default-covers')

function absMediaUrl(url) {
  const u = String(url || '').trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  const base = String(cfg.http.baseUrl || '').replace(/\/$/, '')
  if (u.indexOf('/uploads/') === 0 || u.indexOf('/images/') === 0) return base + u
  const name = u.replace(/\\/g, '/').split('/').pop()
  if (name && /\.(jpe?g|png|gif|webp|mp4|mov)$/i.test(name)) return base + '/uploads/' + name
  return base + (u.charAt(0) === '/' ? u : '/' + u)
}

Page({
  data: {
    post: null,
    blocks: [],
    liked: false,
    collected: false,
    likeCount: 0,
    collectCount: 0
  },

  onLoad(options) {
    this._id = options.id
    this.load()
  },

  onShow() {
    try {
      require('../../utils/share').enableShareMenu()
    } catch (e) {}
    if (this._id) {
      this.setData({
        liked: api.isLiked('post', this._id),
        collected: api.isCollected('post', this._id)
      })
    }
  },

  async load() {
    try {
      const post = await api.getPost(this._id)
      if (!post) {
        wx.showToast({ title: '内容不存在', icon: 'none' })
        return
      }
      const d = new Date(post.createdAt)
      post.dateText = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0')
      if (post.publisher && post.publisher.avatar) {
        post.publisher.avatar = absMediaUrl(post.publisher.avatar)
      }
      const blocks = parseMarkdown(post.body).map(b => b.url
        ? Object.assign({}, b, { url: absMediaUrl(b.url) })
        : b)
      this.setData({
        post,
        blocks,
        liked: api.isLiked('post', this._id),
        collected: api.isCollected('post', this._id),
        likeCount: post.likeCount || 0,
        collectCount: post.collectCount || 0
      })
      wx.setNavigationBarTitle({ title: '详情' })
    } catch (e) {
      wx.showToast({ title: e.msg || '加载失败', icon: 'none' })
    }
  },

  async onLike() {
    const p = this.data.post
    if (!p) return
    if (!(await api.requireLogin({ tip: '登录后才能点赞' }))) return
    const r = api.toggleLike({
      id: p.id, kind: 'post', title: p.title,
      catName: p.catName || '内容', coverUrl: (p.images && p.images[0]) || p.coverUrl || '',
      likeCount: this.data.likeCount
    })
    this.setData({ liked: r.on, likeCount: r.likeCount != null ? r.likeCount : this.data.likeCount })
    wx.showToast({ title: r.on ? '已点赞' : '已取消点赞', icon: 'none' })
  },

  async onCollect() {
    const p = this.data.post
    if (!p) return
    if (!(await api.requireLogin({ tip: '登录后才能收藏' }))) return
    const r = api.toggleCollect({
      id: p.id, kind: 'post', title: p.title,
      catName: p.catName || '内容', coverUrl: (p.images && p.images[0]) || p.coverUrl || '',
      collectCount: this.data.collectCount
    })
    this.setData({ collected: r.on, collectCount: r.collectCount != null ? r.collectCount : this.data.collectCount })
    wx.showToast({ title: r.on ? '已收藏' : '已取消收藏', icon: 'none' })
  },

  previewImg(e) {
    wx.previewImage({ urls: [e.currentTarget.dataset.url] })
  },

  openRelated(e) {
    const id = e.currentTarget.dataset.id
    wx.redirectTo({ url: '/pages/post-detail/post-detail?id=' + id })
  },

  goFeedback() {
    const p = this.data.post
    if (!p) return
    wx.navigateTo({
      url: '/pages/feedback-submit/feedback-submit?sourceType=post&sourceId=' +
        encodeURIComponent(p.id) + '&sourceTitle=' + encodeURIComponent(p.title || '')
    })
  },

  onShareAppMessage() {
    return shareCardForPost(this.data.post)
  },

  onShareTimeline() {
    const card = shareCardForPost(this.data.post)
    return {
      title: card.title,
      query: 'id=' + (this._id || ''),
      imageUrl: card.imageUrl
    }
  }
})
