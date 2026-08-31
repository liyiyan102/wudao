/**
 * 常量（与小程序 utils/data.js 保持同步）
 */
const CONTENT_CATS = {
  outfit: { name: '穿搭' },
  recovery: { name: '康复' },
  culture: { name: '文化' },
  studio: { name: '舞室' },
  fresh: { name: '新鲜事' }
}

const BUDDY_SUBTYPES = {
  practice: { name: '练舞' },
  group: { name: '团购' },
  teammate: { name: '找队友' },
  other: { name: '其他' }
}

const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安']

module.exports = { CONTENT_CATS, BUDDY_SUBTYPES, CITIES }
