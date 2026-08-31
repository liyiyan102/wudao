/**
 * 批量导入：单元格里的本地文件名解析成 /uploads/…
 * 后台直发和批量导入共用 server/data/uploads/
 */
const fs = require('fs')
const path = require('path')

const UPLOADS = path.join(__dirname, '..', 'data', 'uploads')

function ensureDirs() {
  if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true })
}

function isReadyUrl(u) {
  if (!u) return false
  return /^https?:\/\//i.test(u) || u.indexOf('/uploads/') === 0
}

/** 仅允许 uploads 目录下的纯文件名（防路径穿越） */
function resolveLocalFile(ref) {
  ensureDirs()
  let name = String(ref || '').trim()
  if (!name) return null
  if (/^file:\/\//i.test(name)) name = name.replace(/^file:\/\//i, '')
  name = path.basename(name.replace(/\\/g, '/'))
  if (!name || name === '.' || name === '..') return null
  const src = path.join(UPLOADS, name)
  if (!fs.existsSync(src) || !fs.statSync(src).isFile()) return null
  return '/uploads/' + name
}

/**
 * @returns {{ ok: true, url: string } | { ok: false, error: string } | { ok: true, url: '' }}
 */
function resolveMediaRef(ref) {
  const u = String(ref || '').trim()
  if (!u) return { ok: true, url: '' }
  if (isReadyUrl(u)) return { ok: true, url: u.slice(0, 500) }
  const resolved = resolveLocalFile(u)
  if (!resolved) {
    const base = path.basename(u.replace(/\\/g, '/'))
    return {
      ok: false,
      error: `文件「${base}」未找到，请放到 server/data/uploads/（与后台上传同一目录）后填文件名`
    }
  }
  return { ok: true, url: resolved }
}

/** 改写正文里 ![x](file) / @[x](file) 的本地引用 */
function rewriteBodyMedia(body) {
  if (!body) return { body: body || '', errors: [] }
  const errors = []
  const replacer = (m, alt, url) => {
    const r = resolveMediaRef(url.trim())
    if (!r.ok) {
      errors.push(r.error)
      return m
    }
    const prefix = m.charAt(0) === '@' ? '@' : '!'
    return prefix + '[' + alt + '](' + r.url + ')'
  }
  let out = String(body)
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, replacer)
  out = out.replace(/@\[([^\]]*)\]\(([^)]+)\)/g, replacer)
  return { body: out, errors }
}

module.exports = {
  UPLOADS,
  ensureDirs,
  isReadyUrl,
  resolveMediaRef,
  rewriteBodyMedia
}
