/**
 * 敏感词粗筛（架构 §5.3：本地词库前置，可疑才调官方接口，节省 msgSecCheck 配额）
 * MMVP：内置极简词表 + 可选扩展文件（敏感词库运营维护，本表仅作粗筛兜底）
 */
const BAD_WORDS = [
  '赌博', '代考', '办证', '刷单', '贷款包过', '枪支', '毒品', '色情', '招嫖',
  '反动', '法轮', '代开发票', '转账返利', '裸聊', '约炮', '买号', '黑产'
]

/** 命中返回词，未命中返回 null */
function matchBadWord(text) {
  const s = String(text || '')
  for (const w of BAD_WORDS) {
    if (s.indexOf(w) > -1) return w
  }
  return null
}

/** 组合审核：粗筛 → 官方接口（架构 §6.2 ②③） */
async function checkText(openid, text) {
  const hit = matchBadWord(text)
  if (hit) return { pass: false, reason: '内容含违规信息，请修改' }
  const wxapi = require('./wxapi')
  return wxapi.msgSecCheck(openid, text)
}

module.exports = { matchBadWord, checkText }
