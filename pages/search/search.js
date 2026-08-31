const api = require('../../utils/api')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    capsuleRight: 96,
    autoFocus: true,
    placeholder: '搜索内容、舞种…',
    keyword: '',
    state: 'init', // init | result | empty
    history: [],
    hot: [],
    results: [],
    total: 0
  },

  onLoad(options) {
    this.layoutNav()
    const fromActivity = options && options.from === 'activity'
    this.setData({
      history: api.getSearchHistory(),
      placeholder: fromActivity ? '搜索活动、内容…' : '搜索内容、舞种…'
    })
    api.getHotSearches().then(hot => this.setData({ hot })).catch(() => {})
    // 支持外部带词进入（如分享/埋点回跳）
    if (options && options.q) {
      this.runSearch(decodeURIComponent(options.q))
    }
  },

  /** 顶栏避开右侧原生胶囊 */
  layoutNav() {
    try {
      const win = (wx.getWindowInfo && wx.getWindowInfo()) || wx.getSystemInfoSync()
      const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
      let statusBarHeight = (win && win.statusBarHeight) || 20
      let navBarHeight = 44
      let capsuleRight = 96
      if (menu && menu.height) {
        const gap = Math.max(0, menu.top - statusBarHeight)
        navBarHeight = menu.height + gap * 2
        if (win && win.windowWidth) {
          capsuleRight = Math.max(80, win.windowWidth - menu.left + 6)
        }
      }
      this.setData({ statusBarHeight, navBarHeight, capsuleRight })
    } catch (e) {
      this.setData({ statusBarHeight: 20, navBarHeight: 44, capsuleRight: 96 })
    }
  },

  onShow() {
    try {
      require('../../utils/share').enableShareMenu()
    } catch (e) {}
    // 详情页点赞/收藏后回到结果页，静默刷新（不重写搜索历史）
    if (this.data.state !== 'init' && this._lastKeyword) {
      api.searchOnly(this._lastKeyword).then(res => this.applyResult(res)).catch(() => {})
    }
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value })
    if (!e.detail.value && this.data.state !== 'init') {
      this.setData({ state: 'init', history: api.getSearchHistory() })
    }
  },

  clearKeyword() {
    this.setData({ keyword: '', state: 'init', history: api.getSearchHistory(), autoFocus: true })
  },

  doSearch() {
    const kw = this.data.keyword.trim()
    if (!kw) {
      wx.showToast({ title: '想搜点什么？', icon: 'none' })
      return
    }
    this.runSearch(kw)
  },

  tapWord(e) {
    const word = e.currentTarget.dataset.word
    this.setData({ keyword: word })
    this.runSearch(word)
  },

  clearHistory() {
    wx.showModal({
      title: '清空搜索历史',
      content: '确定清空全部搜索历史吗？',
      success: res => {
        if (res.confirm) {
          api.clearSearchHistory()
          this.setData({ history: [] })
        }
      }
    })
  },

  async runSearch(kw) {
    const word = String(kw || '').trim()
    if (!word) return
    this._lastKeyword = word
    api.addSearchHistory(word)
    this.setData({ history: api.getSearchHistory() })
    try {
      const res = await api.searchAll(word)
      this.applyResult(res)
    } catch (e) {
      wx.showToast({ title: e.msg || '搜索失败', icon: 'none' })
    }
  },

  applyResult(res) {
    const results = (res.results || []).map(p => {
      if (p.publisher && p.publisher.avatar) {
        let ava = p.publisher.avatar
        if (ava.indexOf('/uploads/') === 0) {
          ava = 'https://daitto.site/wudao' + ava
        }
        p.publisher.avatar = ava
      }
      return p
    })
    this.setData({
      keyword: res.keyword,
      state: res.total > 0 ? 'result' : 'empty',
      results,
      total: res.total,
      autoFocus: false
    })
    if (res.total > 0) wx.pageScrollTo({ scrollTop: 0, duration: 0 })
  },

  openItem(e) {
    const id = e.currentTarget.dataset.id
    const kind = e.currentTarget.dataset.kind
    if (kind === 'activity') {
      wx.navigateTo({ url: '/pages/activity-detail/activity-detail?id=' + id })
    } else {
      wx.navigateTo({ url: '/pages/post-detail/post-detail?id=' + id })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  onShareAppMessage() {
    const { DEFAULT_COVERS } = require('../../utils/default-covers')
    const kw = (this.data.keyword || '').trim()
    const path = kw
      ? '/pages/search/search?q=' + encodeURIComponent(kw)
      : '/pages/search/search'
    return {
      title: kw ? ('舞岛 · 搜「' + kw + '」') : '舞岛 · 搜索街舞内容和活动',
      path,
      imageUrl: DEFAULT_COVERS.official
    }
  },

  onShareTimeline() {
    const { DEFAULT_COVERS } = require('../../utils/default-covers')
    const kw = (this.data.keyword || '').trim()
    return {
      title: kw ? ('舞岛 · 搜「' + kw + '」') : '舞岛 · 搜索街舞内容和活动',
      query: kw ? ('q=' + encodeURIComponent(kw)) : '',
      imageUrl: DEFAULT_COVERS.official
    }
  }
})
