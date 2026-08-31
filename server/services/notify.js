/**
 * 站内通知（架构 §6.4）
 * 5 类：system / like / comment / collect / apply
 * 存储用 targetType/targetId/snapshot（v1 圈子/关注零改造）；
 * 输出层（message 路由）映射为 postId/postTitle 兼容现有前端结构。
 */
const { getDB } = require('../db')

async function writeMessage({ toUserId, fromUserId, type, targetType, targetId, snapshot, content }) {
  if (String(toUserId) === String(fromUserId)) return // 自己互动自己不通知
  await getDB().collection('messages').insertOne({
    toUserId, fromUserId: fromUserId || '',
    type, targetType: targetType || 'post', targetId: targetId || '',
    snapshot: snapshot || '', content: content || '',
    read: false, createdAt: new Date()
  })
}

module.exports = { writeMessage }
