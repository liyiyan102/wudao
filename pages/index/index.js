/**
 * 首页 · 严格对齐《舞岛MMVP-界面设计-非社区版》屏1
 * 内容流只读后台 /api/content/feed，无写死 mock
 */
console.log('[wudao] index.js loaded')

const TABS = [
  { key: 'discover', name: '发现' },
  { key: 'city', name: '城市' },
  { key: 'culture', name: '文化' },
  { key: 'fresh', name: '新鲜事' },
  { key: 'outfit', name: '穿搭' }
]

/** 设计稿标签简称 + 色类（与 HTML .cat / .cat.c2… 一致） */
const CAT_VIEW = {
  outfit:   { name: '穿搭',   tagCls: '',   coverCls: 'p' },
  recovery: { name: '康复',   tagCls: 'c2', coverCls: 'g' },
  culture:  { name: '文化',   tagCls: 'c4', coverCls: 'b' },
  studio:   { name: '舞室',   tagCls: '',   coverCls: 'p' },
  fresh:    { name: '新鲜事', tagCls: 'c6', coverCls: 'c' }
}

function formatAvatarUrl(url) {
  if (!url) return ''
  if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0 || url.indexOf('wxfile://') === 0) return url
  if (url.indexOf('/uploads/') === 0) {
    try {
      var cfg = require('../../utils/config')
      var base = (cfg.http && cfg.http.baseUrl) ? cfg.http.baseUrl : 'https://daitto.site/wudao'
      return base + url
    } catch (e) {
      return 'https://daitto.site/wudao' + url
    }
  }
  return url
}

function slim(list) {
  return (list || []).map(function (p) {
    var pub = p.publisher || {}
    var images = p.images || []
    var body = String(p.body || p.summary || '').replace(/[#>*`\[\]]/g, ' ')
    var name = pub.nickname || p.pubName || '舞岛'
    var view = CAT_VIEW[p.cat] || {
      name: shortCat(p.catName),
      tagCls: p.tagCls || '',
      coverCls: p.coverCls || 'p'
    }
    var rawAva = pub.avatar || p.pubAvatar || ''
    return {
      id: p.id,
      title: p.title || '',
      cat: p.cat || '',
      catName: view.name,
      tagCls: view.tagCls,
      coverCls: view.coverCls,
      hasCover: !!p.hasCover,
      coverUrl: p.coverUrl || images[0] || '',
      summary: body.slice(0, 72),
      pubName: name,
      pubAvatar: formatAvatarUrl(rawAva),
      nickInitial: p.nickInitial || name.charAt(0),
      timeText: p.timeText || ''
    }
  })
}

function shortCat(name) {
  var map = {
    '文化历史': '文化',
    '赛事动态': '赛事',
    '大师课预告': '大师课',
    '舞室介绍': '舞室'
  }
  return map[name] || name || '内容'
}

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    capsuleRight: 96,
    scope: 'discover',
    city: '北京',
    tabs: TABS,
    posts: [],
    loading: true,
    errorMsg: '',
    personaFabExpanded: true,
    personaFabVisible: true
  },

  onLoad() {
    this.layoutNav()
    try {
      var api = require('../../utils/api')
      this.setData({ city: api.getCity() || '北京' })
    } catch (e) { /* ignore */ }
  },

  onShow() {
    try {
      require('../../utils/share').enableShareMenu()
    } catch (e) {}
    try {
      var api = require('../../utils/api')
      this.setData({ city: api.getCity() || '北京' })
    } catch (e) { /* ignore */ }
    this.reloadFeed()
    this.showPersonaFabBriefly()
  },

  onHide() {
    this.clearPersonaFabTimer()
  },

  onUnload() {
    this.clearPersonaFabTimer()
  },

  /** 顶栏高度对齐胶囊，搜索与 tab 同一行垂直居中 */
  layoutNav() {
    try {
      var win = (wx.getWindowInfo && wx.getWindowInfo()) || wx.getSystemInfoSync()
      var menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
      var statusBarHeight = (win && win.statusBarHeight) || 20
      var navBarHeight = 44
      var capsuleRight = 96
      if (menu && menu.height) {
        var gap = Math.max(0, menu.top - statusBarHeight)
        navBarHeight = menu.height + gap * 2
        if (win && win.windowWidth) {
          capsuleRight = Math.max(80, win.windowWidth - menu.left + 6)
        }
      }
      this.setData({
        statusBarHeight: statusBarHeight,
        navBarHeight: navBarHeight,
        capsuleRight: capsuleRight
      })
    } catch (e) {
      this.setData({ statusBarHeight: 20, navBarHeight: 44, capsuleRight: 96 })
    }
  },

  reloadFeed() {
    var that = this
    var scope = this.data.scope
    this.setData({ loading: true, errorMsg: '' })
    try {
      var api = require('../../utils/api')
      Promise.resolve(api.getFeed(scope)).then(function (posts) {
        var out = slim(posts)
        console.log('[wudao] 首页 feed', scope, out.length)
        that.setData({
          posts: out,
          loading: false,
          errorMsg: ''
        })
      }).catch(function (e) {
        console.error('[wudao] feed fail', e)
        that.setData({
          posts: [],
          loading: false,
          errorMsg: (e && e.msg) || '加载失败，请确认后端已启动'
        })
      })
    } catch (e) {
      console.error('[wudao] require api fail', e)
      this.setData({
        posts: [],
        loading: false,
        errorMsg: '接口加载失败'
      })
    }
  },

  switchTab(e) {
    var key = e.currentTarget.dataset.key
    if (this.data.scope === key) {
      if (key === 'city') this.goCityPick()
      return
    }
    this.setData({ scope: key })
    this.reloadFeed()
  },

  goCityPick() {
    wx.navigateTo({ url: '/pages/city-pick/city-pick' })
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },

  goPersonaTest() {
    if (!this.data.personaFabVisible) return
    wx.navigateTo({ url: '/pages/persona-test/persona-test' })
  },

  closePersonaFab() {
    this.clearPersonaFabTimer()
    this._personaFabIntroDone = true
    this.setData({ personaFabExpanded: false, personaFabVisible: false })
  },

  showPersonaFabBriefly() {
    if (!this.data.personaFabVisible) return
    if (this._personaFabIntroDone) return
    this._personaFabIntroDone = true
    var that = this
    this.clearPersonaFabTimer()
    this.setData({ personaFabExpanded: true })
    this.personaFabTimer = setTimeout(function () {
      that.setData({ personaFabExpanded: false })
    }, 3000)
  },

  clearPersonaFabTimer() {
    if (this.personaFabTimer) {
      clearTimeout(this.personaFabTimer)
      this.personaFabTimer = null
    }
  },

  openPost(e) {
    var id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pages/post-detail/post-detail?id=' + id })
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
