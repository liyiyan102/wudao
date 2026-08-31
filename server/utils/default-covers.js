/**
 * 活动兜底封面：返回小程序包内 PNG 路径（不要用 SVG data URI，image 组件不渲染）。
 */
const DEFAULT_COVERS = {
  official: '/images/covers/official.jpg',
  contest: '/images/covers/contest.jpg',
  master: '/images/covers/master.jpg',
  practice: '/images/covers/practice.jpg',
  group: '/images/covers/group.jpg',
  teammate: '/images/covers/teammate.jpg',
  other: '/images/covers/other.jpg'
}

function getDefaultCover(type, buddySubType) {
  if (type === 'buddy') {
    const sub = buddySubType || 'practice'
    return DEFAULT_COVERS[sub] || DEFAULT_COVERS.practice
  }
  return DEFAULT_COVERS[type] || DEFAULT_COVERS.other
}

function isUsableCover(url) {
  if (!url) return false
  const s = String(url)
  if (s.indexOf('data:image/svg') === 0) return false
  return true
}

module.exports = { DEFAULT_COVERS, getDefaultCover, isUsableCover }
