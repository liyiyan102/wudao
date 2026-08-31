/** 通用工具 */

let _seq = 0

function genId(prefix) {
  _seq += 1
  return prefix + '_' + Date.now().toString(36) + _seq.toString(36)
}

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

/** 相对当前时间偏移 n 天（可指定小时/分钟） */
function dayOffset(days, hour, minute) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  if (hour != null) d.setHours(hour, minute || 0, 0, 0)
  return d.getTime()
}

/** 8月18日 14:30 */
function formatTime(ts) {
  const d = new Date(ts)
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

/** 周六 19:30 */
function formatWeek(ts) {
  if (!ts) return '时间不限' // 时间选填：无时间帖（随时约型）
  const w = ['日', '一', '二', '三', '四', '五', '六']
  const d = new Date(ts)
  return '周' + w[d.getDay()] + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

/** 刚刚 / n分钟前 / n小时前 / n天前 / 8月2日 */
function relativeTime(ts) {
  const diff = Date.now() - ts
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 7 * 24 * 60 * 60 * 1000) return Math.floor(diff / 86400000) + '天前'
  const d = new Date(ts)
  return (d.getMonth() + 1) + '月' + d.getDate() + '日'
}

/** picker 用：Date → 'YYYY-MM-DD' */
function toDateStr(ts) {
  const d = new Date(ts)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

/** picker 用：Date → 'HH:mm' */
function toTimeStr(ts) {
  const d = new Date(ts)
  return pad(d.getHours()) + ':' + pad(d.getMinutes())
}

/** 'YYYY-MM-DD' + 'HH:mm' → ts */
function fromPicker(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = (timeStr || '00:00').split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, 0).getTime()
}

/** 端侧匿名 UID（提交需求/加入用；跨设备不同） */
function getUid() {
  const KEY = 'wudao_uid'
  let u = wx.getStorageSync(KEY)
  if (!u) {
    u = 'u' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36)
    wx.setStorageSync(KEY, u)
  }
  return u
}

/** 描述里夹带联系方式时弱提示（服务端仍必审） */
function hasContactLeak(text) {
  return /加微|加\s*v|微信[:：]|wechat|wx[:：]|vx[:：]/i.test(String(text || ''))
}

function formatDateLabel(dateStr) {
  if (!dateStr) return ''
  const parts = String(dateStr).trim().split('-')
  if (parts.length < 3) return String(dateStr)
  return Number(parts[1]) + '月' + Number(parts[2]) + '日'
}

function composeDateText(startDate, endDate, fallback) {
  const a = formatDateLabel(startDate)
  const b = formatDateLabel(endDate)
  if (a && b) return a === b ? a : (a + ' - ' + b)
  if (a || b) return a || b
  return fallback === undefined ? '时间待定' : fallback
}

function normalizeTimeValue(t) {
  const m = String(t || '').trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m) return ''
  return String(m[1]).padStart(2, '0') + ':' + m[2]
}

function composeTimeText(startTime, endTime) {
  const a = normalizeTimeValue(startTime)
  const b = normalizeTimeValue(endTime)
  if (a && b) return a === b ? a : (a + ' - ' + b)
  return a || b || ''
}

/**
 * 找搭子展示：
 * - dateText：封面日期（可跨天）
 * - timeText：时段；同日为「19:00 - 21:00」，跨日为「8月25日 19:00 - 8月26日 10:00」的时段部分优先短写
 * - timeLabel：详情「时间」整行
 */
function composeBuddySchedule(startDate, endDate, startTime, endTime, fallback) {
  const dateText = composeDateText(startDate, endDate, fallback === undefined ? '时间待定' : fallback)
  const st = normalizeTimeValue(startTime)
  const et = normalizeTimeValue(endTime)
  const sameDay = !!(startDate && endDate && startDate === endDate) || !!(startDate && !endDate)
  let timeText = ''
  let timeLabel = dateText

  if (st || et) {
    if (sameDay || !endDate || startDate === endDate) {
      timeText = composeTimeText(st, et)
      timeLabel = dateText === '时间待定' ? timeText : (dateText + (timeText ? ' · ' + timeText : ''))
    } else {
      const a = formatDateLabel(startDate)
      const b = formatDateLabel(endDate)
      const left = [a, st].filter(Boolean).join(' ')
      const right = [b, et].filter(Boolean).join(' ')
      timeText = left && right ? (left + ' - ' + right) : (left || right)
      timeLabel = timeText || dateText
    }
  }

  return { dateText, timeText, timeLabel }
}

/** 构建「日期 + 时 + 分」合一选择器（multiSelector） */
function buildDatetimePicker(daysAhead) {
  const days = daysAhead || 120
  const dateLabels = []
  const dateValues = []
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  for (let i = 0; i < days; i++) {
    const d = new Date(base.getTime() + i * 86400000)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const day = d.getDate()
    dateValues.push(y + '-' + pad(m) + '-' + pad(day))
    const week = '日一二三四五六'[d.getDay()]
    dateLabels.push(m + '月' + day + '日 周' + week)
  }
  const hours = []
  for (let h = 0; h < 24; h++) hours.push(pad(h) + '时')
  const minutes = ['00分', '15分', '30分', '45分']
  const minuteValues = ['00', '15', '30', '45']
  return {
    range: [dateLabels, hours, minutes],
    dateValues,
    minuteValues
  }
}

function indexOfDate(dateValues, dateStr, fallback) {
  const i = dateValues.indexOf(dateStr)
  return i >= 0 ? i : (fallback || 0)
}

function indexOfHour(timeStr, fallback) {
  const m = normalizeTimeValue(timeStr).match(/^(\d{2})/)
  if (!m) return fallback == null ? 19 : fallback
  return Math.min(23, Math.max(0, Number(m[1])))
}

function indexOfMinute(timeStr, minuteValues, fallback) {
  const t = normalizeTimeValue(timeStr)
  const mm = t.slice(3, 5)
  const i = (minuteValues || []).indexOf(mm)
  return i >= 0 ? i : (fallback || 0)
}

/** multiSelector value → { dateStr, timeStr, label } */
function parseDatetimePicker(picker, indexes) {
  const di = indexes[0] || 0
  const hi = indexes[1] || 0
  const mi = indexes[2] || 0
  const dateStr = picker.dateValues[di] || ''
  const timeStr = pad(hi) + ':' + (picker.minuteValues[mi] || '00')
  const label = formatDateLabel(dateStr) + ' ' + timeStr
  return { dateStr, timeStr, label }
}

/** 开始时刻 +2 小时作为默认结束（同一天内，不超过 23:45） */
function defaultEndFromStart(dateStr, timeStr) {
  const t = fromPicker(dateStr, timeStr || '00:00')
  const end = new Date(t + 2 * 3600000)
  const startDay = dateStr
  let endDate = toDateStr(end.getTime())
  let hh = end.getHours()
  let mm = end.getMinutes()
  // 跨天则钳到当天 23:45
  if (endDate !== startDay) {
    endDate = startDay
    hh = 23
    mm = 45
  }
  // 对齐到 15 分钟
  mm = [0, 15, 30, 45].reduce((best, x) => (Math.abs(x - mm) < Math.abs(best - mm) ? x : best), 0)
  return {
    dateStr: endDate,
    timeStr: pad(hh) + ':' + pad(mm)
  }
}

const WD_NAME = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '日' }

function parseWeekdays(raw) {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map(Number).filter(n => n >= 1 && n <= 7))].sort((a, b) => a - b)
  }
  return parseWeekdaysFromText(String(raw || ''))
}

function parseWeekdaysFromText(text) {
  const s = String(text || '')
  if (/工作日/.test(s)) return [1, 2, 3, 4, 5]
  if (/周末/.test(s)) return [6, 7]
  if (/每天|每日/.test(s)) return [1, 2, 3, 4, 5, 6, 7]
  if (!/每周|每星期|周[一二三四五六日天]/.test(s)) return []
  const found = []
  const re = /[周星]期?([一二三四五六日天])/g
  let m
  while ((m = re.exec(s))) {
    const map = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7 }
    if (map[m[1]]) found.push(map[m[1]])
  }
  return parseWeekdays(found)
}

function formatWeekdays(days) {
  const list = parseWeekdays(days)
  if (!list.length) return ''
  if (list.length === 7) return '每天'
  if (list.join(',') === '1,2,3,4,5') return '每周工作日'
  if (list.join(',') === '6,7') return '每周末'
  if (list.length === 1) return '每周' + WD_NAME[list[0]]
  return '每周' + list.map(n => WD_NAME[n]).join('、')
}

function inferDateMode(a) {
  if (!a) return 'none'
  const mode = String(a.dateMode || '')
  if (mode === 'none' || mode === 'weekly' || mode === 'once') return mode
  const days = parseWeekdays(a.weekdays)
  if (days.length) return 'weekly'
  if (parseWeekdaysFromText(a.dateText).length) return 'weekly'
  if (a.startDate || a.endDate) return 'once'
  if (/月\s*\d{1,2}\s*日/.test(String(a.dateText || ''))) return 'once'
  return 'none'
}

function composeActivitySchedule(a) {
  a = a || {}
  const mode = inferDateMode(a)
  const startTime = normalizeTimeValue(a.startTime)
  const endTime = normalizeTimeValue(a.endTime)
  const times = composeTimeText(startTime, endTime)
  if (mode === 'none') {
    return { dateMode: 'none', weekdays: [], dateText: '', timeText: times, timeLabel: times }
  }
  if (mode === 'weekly') {
    let days = parseWeekdays(a.weekdays)
    if (!days.length) days = parseWeekdaysFromText(a.dateText)
    const dateText = formatWeekdays(days) || '每周循环'
    const timeLabel = [dateText, times].filter(Boolean).join(' · ')
    return { dateMode: 'weekly', weekdays: days, dateText, timeText: times, timeLabel }
  }
  const sched = composeBuddySchedule(a.startDate, a.endDate, startTime, endTime, '')
  let dateText = sched.dateText
  if (dateText === '时间待定') dateText = ''
  if (!dateText && a.dateText && !parseWeekdaysFromText(a.dateText)) {
    dateText = String(a.dateText).replace(/^时间待定$/, '')
  }
  const timeText = sched.timeText || times
  const timeLabel = sched.timeLabel && sched.timeLabel !== '时间待定'
    ? sched.timeLabel
    : [dateText, timeText].filter(Boolean).join(' · ')
  return { dateMode: 'once', weekdays: [], dateText, timeText, timeLabel }
}

/** 活动是否已过期：不设日期 / 每周循环 不过期；指定日期看结束日 */
function isActivityExpired(a) {
  if (!a) return false
  if (a.buddyStatus === 'ended') return true
  const mode = inferDateMode(a)
  if (mode === 'none' || mode === 'weekly') return false
  const date = a.endDate || a.startDate
  if (!date) return false
  const time = a.endTime || '23:59'
  const ts = new Date(String(date).replace(/-/g, '/') + ' ' + time).getTime()
  return !isNaN(ts) && ts < Date.now()
}

module.exports = {
  genId, pad, dayOffset, formatTime, formatWeek, relativeTime,
  toDateStr, toTimeStr, fromPicker, getUid, hasContactLeak,
  formatDateLabel, composeDateText, normalizeTimeValue, composeTimeText,
  composeBuddySchedule, composeActivitySchedule, parseWeekdays, formatWeekdays, inferDateMode,
  buildDatetimePicker,
  indexOfDate, indexOfHour, indexOfMinute, parseDatetimePicker, defaultEndFromStart,
  isActivityExpired
}
