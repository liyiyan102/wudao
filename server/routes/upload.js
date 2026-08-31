/**
 * 后台媒体上传（admin 鉴权）
 * POST /api/admin/upload/image   ≤10MB jpg/jpeg/png/gif/webp
 * POST /api/admin/upload/video   ≤100MB mp4/mov/m4v
 * 落盘 server/data/uploads/，静态托管于 /uploads/*；返回相对 URL（换域名不失效）
 */
const express = require('express')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const config = require('../config')
const { ok, fail } = require('../utils/resp')

const router = express.Router()
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads')

fs.mkdirSync(UPLOAD_DIR, { recursive: true })

function makeUpload(extensions, maxMB) {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOAD_DIR),
      filename: (req, file, cb) => {
        // 服务端重命名：时间36进制-随机串.扩展名（防穿越/注入）
        const ext = path.extname(file.originalname || '').toLowerCase()
        cb(null, Date.now().toString(36) + '-' + crypto.randomUUID().slice(0, 8) + ext)
      }
    }),
    limits: { fileSize: maxMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase()
      if (extensions.indexOf(ext) === -1) return cb(new Error('BAD_EXT'))
      cb(null, true)
    }
  }).single('file')
}

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  try {
    const payload = jwt.verify(token, config.JWT_SECRET)
    if (payload.role !== 'admin') throw new Error()
    next()
  } catch (e) {
    fail(res, 401, '请先登录', 401)
  }
}

function handle(kind, extensions, maxMB) {
  return (req, res) => {
    makeUpload(extensions, maxMB)(req, res, err => {
      if (err) {
        if (err.message === 'BAD_EXT') return fail(res, 4201, '文件类型不支持（' + extensions.join('/') + '）')
        if (err.code === 'LIMIT_FILE_SIZE') return fail(res, 4201, '文件超过 ' + maxMB + 'MB 限制')
        return fail(res, 500, '上传失败')
      }
      if (!req.file) return fail(res, 4201, '缺少文件')
      ok(res, { url: '/uploads/' + req.file.filename, kind })
    })
  }
}

router.post('/image', auth, handle('image', ['.jpg', '.jpeg', '.png', '.gif', '.webp'], 10))
router.post('/video', auth, handle('video', ['.mp4', '.mov', '.m4v'], 100))

module.exports = router
