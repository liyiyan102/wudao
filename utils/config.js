/**
 * 全局配置：后端模式切换（Adapter 模式）
 * - 'http' ：对接 server（PGC 后台发布的内容 / 活动）—— 默认，内容以后台为准
 * - 'local'：仅本地调试用 storage 种子，勿用于正式演示
 *
 * 生产：https://daitto.site/wudao
 * 真机连本机：改成电脑局域网 IP（ipconfig getifaddr en0），并勾选「不校验合法域名」
 */
module.exports = {
  mode: 'http',

  http: {
    baseUrl: 'https://daitto.site/wudao',
    // baseUrl: 'http://10.2.37.14:3100',
    // baseUrl: 'http://127.0.0.1:3100',
    mockAuth: true
  }
}
