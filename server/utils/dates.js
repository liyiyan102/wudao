/**
 * 找搭子日期时间文案
 */
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

function composeBuddySchedule(startDate, endDate, startTime, endTime, fallback) {
  const dateText = composeDateText(startDate, endDate, fallback === undefined ? '时间待定' : fallback)
  const st = normalizeTimeValue(startTime)
  const et = normalizeTimeValue(endTime)
  let timeText = ''
  let timeLabel = dateText

  if (st || et) {
    if (!endDate || startDate === endDate) {
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
  formatDateLabel, composeDateText, normalizeTimeValue, composeTimeText, composeBuddySchedule,
  parseWeekdays, parseWeekdaysFromText, formatWeekdays, inferDateMode, composeActivitySchedule,
  isActivityExpired
}
