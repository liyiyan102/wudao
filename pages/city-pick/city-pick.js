const api = require('../../utils/api')
const {
  HOT_CITIES, CITY_GROUPS, CITY_LIST,
  getCityHistory, pushCityHistory, clearCityHistory
} = require('../../utils/cities')

Page({
  data: {
    keyword: '',
    current: '北京',
    history: [],
    hot: HOT_CITIES,
    groups: CITY_GROUPS,
    letters: ['当前', '热门'].concat(CITY_GROUPS.map(g => g.letter)),
    scrollInto: '',
    searchResults: [],
    searching: false
  },

  onLoad() {
    this.refresh()
  },

  refresh() {
    const current = api.getCity() || '北京'
    this.setData({
      current,
      history: getCityHistory().filter(c => c !== current)
    })
  },

  onInput(e) {
    const keyword = (e.detail.value || '').trim()
    if (!keyword) {
      this.setData({ keyword: '', searching: false, searchResults: [] })
      return
    }
    const kw = keyword.toLowerCase()
    const searchResults = CITY_LIST.filter(c =>
      c.name.indexOf(keyword) > -1 ||
      c.province.indexOf(keyword) > -1 ||
      (c.letter && c.letter.toLowerCase() === kw)
    ).slice(0, 40)
    this.setData({ keyword, searching: true, searchResults })
  },

  clearKeyword() {
    this.setData({ keyword: '', searching: false, searchResults: [] })
  },

  clearHistory() {
    wx.showModal({
      title: '清除历史',
      content: '确定清除城市选择历史吗？',
      success: res => {
        if (!res.confirm) return
        clearCityHistory()
        this.setData({ history: [] })
      }
    })
  },

  jumpLetter(e) {
    const letter = e.currentTarget.dataset.letter
    let scrollInto = ''
    if (letter === '当前') scrollInto = 'sec-current'
    else if (letter === '热门') scrollInto = 'sec-hot'
    else scrollInto = 'letter-' + letter
    this.setData({ scrollInto: '' })
    setTimeout(() => this.setData({ scrollInto }), 20)
  },

  onPick(e) {
    this.pick(e.currentTarget.dataset.city)
  },

  pick(city) {
    if (!city) return
    api.setCity(city)
    pushCityHistory(city)
    wx.showToast({ title: '已切换到' + city, icon: 'none' })
    setTimeout(() => wx.navigateBack(), 400)
  }
})
