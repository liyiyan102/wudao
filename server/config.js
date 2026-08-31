/** 配置：环境变量读取（口令与密钥只从环境来） */
require('dotenv').config()

module.exports = {
  PORT: Number(process.env.PORT || 3100),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'wudao-admin-dev',
  JWT_SECRET: process.env.JWT_SECRET || 'wudao-v2-dev-secret',
  /** 子路径部署，如 /wudao（无尾斜杠）；本地开发留空 */
  PUBLIC_BASE_PATH: String(process.env.PUBLIC_BASE_PATH || '').replace(/\/$/, '')
}
