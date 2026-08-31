/**
 * JWT 鉴权中间件（架构 §5.1 / §6.1）
 * - sessions 白名单：登录时写入 jti，登出/吊销即删除 → 服务端可即时失效 token
 * - 每次请求加载用户并拦截封禁（status=banned）
 * - optionalAuth：游客可访问的接口（feed 等），token 有效则富化"我的"状态，无效则静默游客
 */
const jwt = require('jsonwebtoken')
const config = require('../config')
const { getDB } = require('../db')
const { unauthorized } = require('../utils/resp')

function readToken(req) {
  const h = req.headers.authorization || ''
  return h.replace(/^Bearer\s+/i, '')
}

async function resolveUser(req) {
  const token = readToken(req)
  if (!token) return null
  let payload
  try {
    payload = jwt.verify(token, config.JWT_SECRET)
  } catch (e) {
    return null
  }
  if (!payload || !payload.jti) return null
  const db = getDB()
  const sess = await db.collection('sessions').findOne({ _id: payload.jti })
  if (!sess) return null // 已登出/被吊销
  const user = await db.collection('users').findOne({ _id: sess.userId })
  if (!user || user.status === 'banned') return null
  return user
}

/** 必须登录 */
function authRequired(req, res, next) {
  Promise.resolve(resolveUser(req)).then(user => {
    if (!user) return unauthorized(res)
    req.user = user
    next()
  }).catch(next)
}

/** 可选登录：游客放行（req.user 为 null） */
function optionalAuth(req, res, next) {
  Promise.resolve(resolveUser(req)).then(user => {
    req.user = user || null
    next()
  }).catch(next)
}

/** 签发 JWT 并登记 sessions */
async function issueToken(user) {
  const db = getDB()
  const jti = require('crypto').randomUUID()
  const expireAt = new Date(Date.now() + config.TOKEN_TTL_SEC * 1000)
  await db.collection('sessions').insertOne({ _id: jti, userId: user._id, expireAt })
  const token = jwt.sign({ uid: user._id, jti }, config.JWT_SECRET, {
    expiresIn: config.TOKEN_TTL_SEC
  })
  return token
}

/** 吊销（登出 / 封禁全端下线） */
async function revokeToken(jti) {
  if (!jti) return
  await getDB().collection('sessions').deleteOne({ _id: jti })
}
async function revokeAllForUser(userId) {
  await getDB().collection('sessions').deleteMany({ userId })
}

module.exports = { authRequired, optionalAuth, issueToken, revokeToken, revokeAllForUser }
