const api = require('../../utils/api')
const { BUDDY_SUBTYPES } = require('../../utils/data')
const {
  toDateStr, fromPicker, hasContactLeak,
  formatDateLabel, composeActivitySchedule,
  buildDatetimePicker, indexOfDate, indexOfHour, indexOfMinute,
  parseDatetimePicker, defaultEndFromStart
} = require('../../utils/util')

const SUBS = Object.keys(BUDDY_SUBTYPES).map(key => Object.assign({ key }, BUDDY_SUBTYPES[key]))
const DT = buildDatetimePicker(120)
const WEEKDAYS = [
  { n: 1, name: '一' }, { n: 2, name: '二' }, { n: 3, name: '三' },
  { n: 4, name: '四' }, { n: 5, name: '五' }, { n: 6, name: '六' },
  { n: 7, name: '日' }
]
const QUICK_DANCES = [
  'Breaking', 'Hip-hop', 'Locking', 'Popping',
  'Waacking', 'House', 'Krump', 'Jazz'
]

function dtIndex(dateStr, timeStr) {
  return [
    indexOfDate(DT.dateValues, dateStr || toDateStr(Date.now()), 0),
    indexOfHour(timeStr, 19),
    indexOfMinute(timeStr, DT.minuteValues, 0)
  ]
}

function dtLabel(dateStr, timeStr) {
  if (!dateStr) return ''
  return formatDateLabel(dateStr) + (timeStr ? ' ' + timeStr : '')
}

function shortText(text, limit) {
  return String(text || '').trim().replace(/\s+/g, ' ').slice(0, limit || 30)
}

function buildBuddyTitle(data) {
  const city = api.getCity() || '同城'
  const dance = shortText(data.danceStyle, 12)
  const location = shortText(data.location, 12) || city
  const contestName = shortText(data.contestName, 16)
  let title = ''
  if (data.subType === 'teammate') {
    title = (contestName || city) + (dance ? ' · ' + dance : '') + ' 找队友'
  } else if (data.subType === 'group') {
    title = location + (dance ? ' · ' + dance : '') + ' 团购'
  } else if (data.subType === 'other') {
    title = location + (dance ? ' · ' + dance : '') + ' 找搭子'
  } else {
    title = location + (dance ? ' · ' + dance : '') + ' 练舞搭子'
  }
  return shortText(title, 30)
}

function deriveState(data) {
  const sched = composeActivitySchedule({
    dateMode: data.dateMode,
    weekdays: data.weekdays,
    startDate: data.startDateStr,
    endDate: data.endDateStr,
    startTime: data.startTimeStr,
    endTime: data.endTimeStr
  })
  const previewTitle = data.title.trim() || buildBuddyTitle(data)
  const previewTime = sched.timeLabel || '时间待定'
  const subTypeName = (BUDDY_SUBTYPES[data.subType] && BUDDY_SUBTYPES[data.subType].name) || '找搭子'
  const previewDate = sched.dateText || (sched.timeText ? sched.timeText : '时间待定')
  return {
    subTypeName,
    previewTitle,
    previewDate,
    previewTime,
    previewMeta: previewTime || '时间待定',
    previewPlace: data.location || (api.getCity() || '同城'),
    weekdayOn: (data.weekdays || []).reduce((o, n) => { o[n] = true; return o }, {}),
    stepOneReady: !!data.description.trim() && !(data.subType === 'teammate' && !data.contestName.trim())
  }
}

Page({
  data: {
    subTypes: SUBS,
    quickDances: QUICK_DANCES,
    weekdaysOptions: WEEKDAYS,
    step: 1,
    subType: 'practice',
    title: '',
    description: '',
    dateMode: 'none',
    weekdays: [],
    dtRange: DT.range,
    startDateStr: '',
    startTimeStr: '',
    endDateStr: '',
    endTimeStr: '',
    startDtIndex: dtIndex('', '19:00'),
    endDtIndex: dtIndex('', '21:00'),
    startDateLabel: '',
    endDateLabel: '',
    location: '',
    lat: 0,
    lng: 0,
    danceStyle: '',
    headcount: '',
    contestName: '',
    contactWechat: '',
    contactPhone: '',
    previewTitle: '',
    previewDate: '时间待定',
    previewTime: '时间待定',
    previewMeta: '时间待定',
    previewPlace: '同城',
    weekdayOn: {},
    subTypeName: '练舞',
    stepOneReady: false,
    agreed: false,
    busy: false
  },

  onLoad(options) {
    this.syncDerived({})
    if (options && options.prefill) {
      api.getBuddyRequest(options.prefill).then(r => {
        const startDate = r.startDate || ''
        const endDate = r.endDate || ''
        const startTime = r.startTime || ''
        const endTime = r.endTime || ''
        this.syncDerived({
          subType: r.subType || 'practice',
          title: r.title || '',
          description: r.description || '',
          location: r.location || '',
          danceStyle: r.danceStyle || '',
          headcount: r.headcount === '不限' ? '' : (r.headcount || ''),
          contestName: r.contestName || '',
          dateMode: r.dateMode || (startDate ? 'once' : ((r.weekdays && r.weekdays.length) ? 'weekly' : 'none')),
          weekdays: r.weekdays || [],
          startDateStr: startDate,
          startTimeStr: startTime,
          endDateStr: endDate,
          endTimeStr: endTime,
          startDtIndex: dtIndex(startDate, startTime || '19:00'),
          endDtIndex: dtIndex(endDate || startDate, endTime || '21:00'),
          startDateLabel: dtLabel(startDate, startTime),
          endDateLabel: dtLabel(endDate, endTime)
        })
      }).catch(() => {})
    }
  },

  syncDerived(patch) {
    const next = Object.assign({}, this.data, patch)
    this.setData(Object.assign({}, patch, deriveState(next)))
  },

  onSub(e) { this.syncDerived({ subType: e.currentTarget.dataset.key }) },
  onTitle(e) { this.syncDerived({ title: e.detail.value }) },
  onDesc(e) { this.syncDerived({ description: e.detail.value }) },
  onDance(e) { this.syncDerived({ danceStyle: e.detail.value }) },
  onHead(e) { this.syncDerived({ headcount: e.detail.value }) },
  onContest(e) { this.syncDerived({ contestName: e.detail.value }) },
  onWechat(e) { this.syncDerived({ contactWechat: e.detail.value }) },
  onPhone(e) { this.syncDerived({ contactPhone: e.detail.value }) },

  onDateMode(e) {
    const dateMode = e.currentTarget.dataset.mode
    const patch = { dateMode }
    if (dateMode !== 'once') {
      patch.startDateStr = ''
      patch.endDateStr = ''
      patch.startDateLabel = ''
      patch.endDateLabel = ''
    }
    if (dateMode !== 'weekly') patch.weekdays = []
    this.syncDerived(patch)
  },

  onWeekday(e) {
    const n = Number(e.currentTarget.dataset.n)
    const cur = (this.data.weekdays || []).slice()
    const i = cur.indexOf(n)
    if (i > -1) cur.splice(i, 1)
    else cur.push(n)
    this.syncDerived({ weekdays: cur.sort((a, b) => a - b) })
  },

  onStartTimeOnly(e) { this.syncDerived({ startTimeStr: e.detail.value }) },
  onEndTimeOnly(e) { this.syncDerived({ endTimeStr: e.detail.value }) },

  onQuickDance(e) {
    const dance = e.currentTarget.dataset.value
    this.syncDerived({ danceStyle: this.data.danceStyle === dance ? '' : dance })
  },

  nextStep() {
    const d = this.data
    if (!d.description.trim()) {
      return wx.showToast({ title: '先写一下你想约什么', icon: 'none' })
    }
    if (d.subType === 'teammate' && !d.contestName.trim()) {
      return wx.showToast({ title: '请填写比赛名称', icon: 'none' })
    }
    this.setData({ step: 2 })
  },

  prevStep() {
    this.setData({ step: 1 })
  },

  onStartDt(e) {
    const parsed = parseDatetimePicker(DT, e.detail.value || [0, 19, 0])
    const endDef = defaultEndFromStart(parsed.dateStr, parsed.timeStr)
    const patch = {
      startDateStr: parsed.dateStr,
      startTimeStr: parsed.timeStr,
      startDtIndex: e.detail.value,
      startDateLabel: parsed.label,
      // 选完开始：默认结束为同一天（+2 小时）
      endDateStr: endDef.dateStr,
      endTimeStr: endDef.timeStr,
      endDtIndex: dtIndex(endDef.dateStr, endDef.timeStr),
      endDateLabel: dtLabel(endDef.dateStr, endDef.timeStr)
    }
    this.syncDerived(patch)
  },

  onEndDt(e) {
    const parsed = parseDatetimePicker(DT, e.detail.value || [0, 21, 0])
    const startDate = this.data.startDateStr
    const startTime = this.data.startTimeStr
    if (startDate && startTime) {
      const startTs = fromPicker(startDate, startTime)
      const endTs = fromPicker(parsed.dateStr, parsed.timeStr)
      if (endTs < startTs) {
        return wx.showToast({ title: '结束不能早于开始', icon: 'none' })
      }
    }
    this.syncDerived({
      endDateStr: parsed.dateStr,
      endTimeStr: parsed.timeStr,
      endDtIndex: e.detail.value,
      endDateLabel: parsed.label
    })
  },

  clearStartDate() {
    this.syncDerived({
      startDateStr: '',
      startTimeStr: '',
      startDateLabel: '',
      startDtIndex: dtIndex('', '19:00'),
      endDateStr: '',
      endTimeStr: '',
      endDateLabel: '',
      endDtIndex: dtIndex('', '21:00')
    })
  },
  clearEndDate() {
    this.syncDerived({
      endDateStr: '',
      endTimeStr: '',
      endDateLabel: '',
      endDtIndex: dtIndex(this.data.startDateStr, '21:00')
    })
  },

  onLocation() {
    wx.chooseLocation({
      success: res => {
        this.syncDerived({
          location: res.name || res.address || '',
          lat: res.latitude,
          lng: res.longitude
        })
      },
      fail: () => {
        wx.showToast({ title: '可稍后在介绍里写地点', icon: 'none' })
      }
    })
  },
  toggleAgree() { this.setData({ agreed: !this.data.agreed }) },
  goNotice() {
    wx.navigateTo({ url: '/pages/buddy-notice/buddy-notice' })
  },

  async onSubmit() {
    if (this.data.busy) return
    const d = this.data
    if (d.subType === 'teammate' && !d.contestName.trim()) {
      return wx.showToast({ title: '请填写比赛名称', icon: 'none' })
    }
    if (!d.description.trim()) return wx.showToast({ title: '请填写需求描述', icon: 'none' })
    if (!d.contactWechat.trim()) return wx.showToast({ title: '请填写微信号', icon: 'none' })
    if (!d.agreed) return wx.showToast({ title: '请先同意《搭子代发须知》', icon: 'none' })
    const finalTitle = d.title.trim() || buildBuddyTitle(d)
    if (hasContactLeak(finalTitle + d.description)) {
      wx.showToast({ title: '请勿在标题/介绍中填写联系方式', icon: 'none' })
      return
    }
    if (!(await api.requireLogin({ tip: '登录后才能发布找搭子' }))) return
    this.setData({ busy: true })
    try {
      const sched = composeActivitySchedule({
        dateMode: d.dateMode,
        weekdays: d.weekdays,
        startDate: d.dateMode === 'once' ? d.startDateStr : '',
        endDate: d.dateMode === 'once' ? d.endDateStr : '',
        startTime: d.startTimeStr,
        endTime: d.endTimeStr
      })
      if (d.dateMode === 'weekly' && !(d.weekdays && d.weekdays.length)) {
        return wx.showToast({ title: '请选择每周几', icon: 'none' })
      }
      const datetime = d.dateMode === 'once' && d.startDateStr
        ? fromPicker(d.startDateStr, d.startTimeStr || '00:00')
        : 0
      await api.submitBuddyRequest({
        subType: d.subType,
        title: finalTitle,
        description: d.description.trim(),
        danceStyle: d.danceStyle.trim(),
        contestName: d.subType === 'teammate' ? d.contestName.trim() : '',
        city: api.getCity() || '',
        location: d.location,
        lat: d.lat,
        lng: d.lng,
        dateMode: sched.dateMode,
        weekdays: sched.weekdays,
        startDate: d.dateMode === 'once' ? d.startDateStr : '',
        endDate: d.dateMode === 'once' ? d.endDateStr : '',
        startTime: d.startTimeStr,
        endTime: d.endTimeStr,
        dateText: sched.dateText,
        timeText: sched.timeText,
        datetime,
        headcount: d.headcount.trim() || '不限',
        contactWechat: d.contactWechat.trim(),
        contactPhone: d.contactPhone.trim()
      })
      wx.redirectTo({ url: '/pages/buddy-request-success/buddy-request-success' })
    } catch (e) {
      wx.showToast({ title: e.msg || '提交失败', icon: 'none' })
      this.setData({ busy: false })
    }
  }
})
