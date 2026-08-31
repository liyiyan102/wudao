/**
 * 舞岛 · 全局入口（先打日志再加载依赖，避免 require 失败时完全无声）
 */
console.log('[wudao] app.js loaded')

App({
  onLaunch() {
    console.log('[wudao] onLaunch')
    try {
      const api = require('./utils/api')
      const cfg = require('./utils/config')
      console.log('[wudao] 代码版本: v1.3-代发撮合 (2026-08-24)', cfg.mode)
      api.initDB()
    } catch (e) {
      console.error('[wudao] 启动依赖失败', e)
    }
    try {
      require('./utils/share').enableShareMenu()
    } catch (e) {}
  },
  onShow() {
    try {
      require('./utils/share').enableShareMenu()
    } catch (e) {}
  },
  globalData: {}
})
