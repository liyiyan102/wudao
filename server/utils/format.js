/**
 * 时间展示格式化（与小程序 utils/util.js 输出完全一致——服务端富化字段对齐端侧，页面零改动）
 */
function pad(n) { return n < 10 ? '0' + n : '' + n }

function relativeTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 7 * 24 * 60 * 60 * 1000) return Math.floor(diff / 86400000) + '天前'
  return (d.getMonth() + 1) + '月' + d.getDate() + '日'
}

/** 搭子帖活动时间；0 = 时间不限（随时约型） */
function formatWeek(ts) {
  if (!ts) return '时间不限'
  const w = ['日', '一', '二', '三', '四', '五', '六']
  const d = new Date(ts)
  return '周' + w[d.getDay()] + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

module.exports = { pad, relativeTime, formatWeek }
