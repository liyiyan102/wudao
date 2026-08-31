/** 公网绝对地址：支持子路径部署 PUBLIC_BASE_PATH=/wudao */
function publicBase(req) {
  const basePath = String(process.env.PUBLIC_BASE_PATH || '').replace(/\/$/, '')
  // 优先固定公网源，避免反代宕机/本机探测时拼出 127.0.0.1
  const fixed = String(process.env.PUBLIC_ORIGIN || '').replace(/\/$/, '')
  if (fixed) return fixed + basePath

  const host = (req && req.get && req.get('host')) || ''
  const isLocal = !host || /^(127\.0\.0\.1|localhost)(:|$)/i.test(host)
  if (isLocal) {
    // 生产兜底，避免把内网 Host 暴露给小程序
    return 'https://daitto.site' + (basePath || '/wudao')
  }
  const proto = (req && req.protocol) || 'https'
  return proto + '://' + host + basePath
}

/** /uploads/… → https://host[/base]/uploads/…；顺带纠正历史内网绝对地址 */
function absUpload(req, u) {
  if (!u) return u
  const s = String(u)
  const pathMatch = s.match(/\/uploads\/[^?\s#]+/i)
  if (s.indexOf('http') === 0) {
    if (pathMatch) return publicBase(req) + pathMatch[0]
    return u
  }
  if (s.indexOf('/uploads/') === 0) return publicBase(req) + s
  // 小程序包内资源，不要改成 /uploads
  if (s.indexOf('/images/') === 0) return s
  const name = s.replace(/\\/g, '/').split('/').pop()
  if (name && /\.(jpe?g|png|gif|webp|mp4|mov)$/i.test(name)) {
    return publicBase(req) + '/uploads/' + name
  }
  return u
}

/** 正文里 ![x](url) / @[x](url) 一律打成可访问的绝对地址 */
function rewriteMarkdownMedia(req, body) {
  if (!body) return body || ''
  return String(body).replace(/([!@]\[[^\]]*\]\()([^)]+)(\))/g, (m, a, url, c) => {
    return a + absUpload(req, String(url).trim()) + c
  })
}

module.exports = { publicBase, absUpload, rewriteMarkdownMedia }
