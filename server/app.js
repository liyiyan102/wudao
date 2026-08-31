/**
 * 舞岛后端 v2（非社区版）
 * - API：/api/content（小程序读）· /api/activities · /api/search · /api/admin（后台）
 * - 后台：/admin 静态页（SPA，口令登录 + JWT）
 * - 存储：JSON 文件（server/data/store.json），PGC 编辑即发布（免审直接 online）
 */
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const config = require('./config')
const store = require('./store')

const app = express()
app.set('trust proxy', true)
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  next()
})

// 健康检查
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'wudao-server', version: 'v2', time: new Date().toISOString() })
})

// API 路由
app.use('/api/content', require('./routes/content'))
app.use('/api/activities', require('./routes/activities'))
app.use('/api/engage', require('./routes/engage'))
app.use('/api/buddy', require('./routes/buddy'))
app.use('/api/feedback', require('./routes/feedback'))
app.use('/api/search', require('./routes/search'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/admin/upload', require('./routes/upload')) // 上传（独立前缀，admin 鉴权）
app.use('/api/admin/import', require('./routes/import')) // 批量导入（内容）
app.use('/api/admin/import', require('./routes/import-activity')) // 批量导入（活动）

// 管理后台静态页 + 上传媒体静态托管
app.use('/admin', express.static(path.join(__dirname, 'admin'), {
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
  }
}))
app.use('/uploads', express.static(path.join(__dirname, 'data', 'uploads'), { maxAge: '30d' }))

app.use((req, res) => res.status(404).json({ code: 404, msg: 'not found' }))
app.use((err, req, res, next) => {
  console.error('[error]', req.method, req.path, err.message)
  res.status(200).json({ code: 500, msg: '服务异常' })
})

store.getDB() // 初始化存储
app.listen(config.PORT, '0.0.0.0', () => {
  console.log('[wudao] server v2 running on http://127.0.0.1:' + config.PORT)
  console.log('[wudao] 管理后台: http://127.0.0.1:' + config.PORT + '/admin/')
  try {
    const os = require('os')
    const nets = os.networkInterfaces()
    Object.keys(nets).forEach(name => {
      (nets[name] || []).forEach(n => {
        if (n.family === 'IPv4' && !n.internal) {
          console.log('[wudao] 真机联调: http://' + n.address + ':' + config.PORT)
        }
      })
    })
  } catch (e) { /* ignore */ }
})
