/**
 * 微信开放能力封装（架构 §5.1 services/wxapi.js）
 * - code2Session：登录（session_key 用完即弃，绝不落库——§6.1）
 * - access_token：wx_tokens 单例缓存，提前 5 分钟刷新
 * - msgSecCheck：文本同步审核
 * - mediaCheckAsync：媒体异步审核（返回 trace_id）
 *
 * dev 降级（未配置 WX_SECRET）：
 *   - code2Session 不可用（由 auth 路由的 mock 登录分支兜底）
 *   - 审核 API 直通（返回通过），日志提示——联调不阻塞，生产必配 Secret
 */
const https = require('https')
const config = require('../config')
const { getDB } = require('../db')

const API_BASE = 'https://api.weixin.qq.com'

/** 出网请求仅微信官方域名（附录 A SSRF 白名单硬编码） */
function wxRequest(path, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null
    const req = https.request(API_BASE + path, {
      method: body ? 'POST' : 'GET',
      timeout: 10000,
      headers: body ? { 'Content-Type': 'application/json' } : {}
    }, res => {
      let buf = ''
      res.on('data', c => { buf += c })
      res.on('end', () => {
        try { resolve(JSON.parse(buf)) } catch (e) { reject(new Error('wx api bad json: ' + buf.slice(0, 200))) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(new Error('wx api timeout')) })
    if (body) req.write(body)
    req.end()
  })
}

async function code2Session(code) {
  const res = await wxRequest(
    `/sns/jscode2session?appid=${config.WX_APPID}&secret=${config.WX_SECRET}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`
  )
  if (res.errcode) throw new Error('code2session fail: ' + res.errcode + ' ' + res.errmsg)
  return res // { openid, session_key, unionid? }
}

/** access_token 集中管理（架构 §5.1：wx_tokens 缓存，2h 有效期提前 5min 刷新） */
let _memToken = null // { value, expireAt } 进程级缓存，重启后从库恢复
async function getAccessToken() {
  const db = getDB()
  const now = Date.now()
  if (_memToken && _memToken.expireAt - 5 * 60 * 1000 > now) return _memToken.value

  const doc = await db.collection('wx_tokens').findOne({ _id: 'access_token' })
  if (doc && doc.expireAt - 5 * 60 * 1000 > now) {
    _memToken = doc
    return doc.value
  }
  const res = await wxRequest(
    `/cgi-bin/token?grant_type=client_credential&appid=${config.WX_APPID}&secret=${config.WX_SECRET}`
  )
  if (res.errcode) throw new Error('get access_token fail: ' + res.errcode + ' ' + res.errmsg)
  const value = { value: res.access_token, expireAt: now + (res.expires_in || 7200) * 1000 }
  await db.collection('wx_tokens').updateOne(
    { _id: 'access_token' }, { $set: value }, { upsert: true }
  )
  _memToken = value
  return value.value
}

/** 文本同步审核。返回 { pass: bool, reason } */
async function msgSecCheck(openid, content) {
  if (!config.WX_SECRET) {
    console.warn('[wxapi] dev 降级：msgSecCheck 直通（未配置 WX_SECRET）')
    return { pass: true, reason: '' }
  }
  const token = await getAccessToken()
  const res = await wxRequest(`/wxa/msg_sec_check?access_token=${token}`, {
    version: 2, openid, scene: 2, content: String(content || '')
  })
  // errcode 0 = 调用成功；detail[].label + suggest 判定
  if (res.errcode) return { pass: false, reason: '检测服务暂不可用，请稍后再试' }
  const risky = (res.detail || []).some(d => d.suggest === 'risky')
  return risky ? { pass: false, reason: '内容含违规信息，请修改' } : { pass: true, reason: '' }
}

/** 媒体异步审核。返回 { traceId }（结果经 /api/seccheck/callback 回调） */
async function mediaCheckAsync(url, mediaType, openid) {
  if (!config.WX_SECRET) {
    console.warn('[wxapi] dev 降级：mediaCheckAsync 直通（未配置 WX_SECRET）')
    return { traceId: '' } // 空 traceId = 不走回调，发帖路由直接判 pass
  }
  const token = await getAccessToken()
  const res = await wxRequest(`/wxa/media_check_async?access_token=${token}`, {
    media_url: url, media_type: mediaType === 'video' ? 2 : 2, version: 2, openid, scene: 2
  })
  if (res.errcode) throw new Error('media_check_async fail: ' + res.errcode + ' ' + res.errmsg)
  return { traceId: res.trace_id }
}

module.exports = { code2Session, getAccessToken, msgSecCheck, mediaCheckAsync }
