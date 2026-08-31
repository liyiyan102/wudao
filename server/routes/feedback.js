/**
 * 用户反馈
 * POST /api/feedback                 提交反馈
 * GET  /api/feedback?uid=            我的反馈
 */
const express = require('express')
const store = require('../store')
const { ok, fail } = require('../utils/resp')

const router = express.Router()

const SOURCE_TYPES = {
  general: '其他反馈',
  post: '帖子反馈',
  activity: '活动反馈'
}

function requireUid(bodyOrQuery, res) {
  const uid = String((bodyOrQuery && (bodyOrQuery.uid || bodyOrQuery.UID)) || '').trim()
  if (!uid) {
    fail(res, 4201, '缺少用户标识')
    return null
  }
  return uid
}

function publicFeedback(f) {
  return {
    id: f.id,
    sourceType: f.sourceType,
    sourceName: SOURCE_TYPES[f.sourceType] || SOURCE_TYPES.general,
    sourceId: f.sourceId || '',
    sourceTitle: f.sourceTitle || '',
    content: f.content || '',
    status: f.status || 'pending',
    statusName: f.status === 'resolved' ? '已处理' : '已收到',
    createdAt: f.createdAt,
    updatedAt: f.updatedAt || f.createdAt
  }
}

router.get('/', (req, res) => {
  const uid = requireUid(req.query, res)
  if (!uid) return
  const items = (store.getDB().feedbacks || [])
    .filter(f => f.uid === uid)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .map(publicFeedback)
  ok(res, { items })
})

router.post('/', (req, res) => {
  const uid = requireUid(req.body, res)
  if (!uid) return
  const content = String(req.body.content || '').trim().slice(0, 1000)
  if (!content) return fail(res, 4201, '请填写反馈内容')

  const rawSource = String(req.body.sourceType || 'general').trim()
  const sourceType = SOURCE_TYPES[rawSource] ? rawSource : 'general'
  const db = store.getDB()
  const item = {
    id: store.uid('fb'),
    uid,
    sourceType,
    sourceId: String(req.body.sourceId || '').trim().slice(0, 80),
    sourceTitle: String(req.body.sourceTitle || '').trim().slice(0, 80),
    content,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  db.feedbacks = db.feedbacks || []
  db.feedbacks.unshift(item)
  store.persist()
  ok(res, publicFeedback(item))
})

module.exports = router
