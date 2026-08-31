/**
 * 活动/分享兜底封面与社交卡片文案生成
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

function withDefaultCover(a) {
  if (!a) return a
  if (isUsableCover(a.coverUrl)) return a
  return Object.assign({}, a, { coverUrl: getDefaultCover(a.type, a.buddySubType) })
}

/** 帖子分类映射到专属高质量封面卡 */
const CAT_SHARE_COVER = {
  contest: '/images/covers/contest.jpg',
  master: '/images/covers/master.jpg',
  outfit: '/images/covers/other.jpg',
  culture: '/images/covers/official.jpg',
  recovery: '/images/covers/other.jpg',
  studio: '/images/covers/other.jpg',
  fresh: '/images/covers/official.jpg'
}

/** 1. 首页分享卡片 */
function homeShareCard() {
  const titles = [
    '舞岛 · 街舞人的专业资讯、活动与练舞搭子 ⚡',
    '你在哪间舞房？来舞岛找同城赛事、大师课与练舞局 🕺',
    '街舞人的地下基地：看懂行的内容，找到值得去的地方 🎧'
  ]
  const title = titles[Math.floor(Math.random() * titles.length)]
  return {
    title: title,
    path: '/pages/index/index',
    imageUrl: DEFAULT_COVERS.official
  }
}

/** 2. 帖子分享卡片文案与图片 */
function shareCardForPost(post) {
  if (!post) {
    return {
      title: '舞岛 · 街舞独家精选内容',
      path: '/pages/index/index',
      imageUrl: DEFAULT_COVERS.official
    }
  }

  const catName = post.catName || '街舞精选'
  let title = post.title || '舞岛街舞深度内容'

  // 针对不同分类添加吸睛前缀标签与后缀钩子
  if (post.cat === 'culture') {
    title = '【街舞文化】' + title + ' 📜 建议收藏'
  } else if (post.cat === 'recovery') {
    title = '【舞者康复】' + title + ' 🚑 练舞党必看'
  } else if (post.cat === 'outfit') {
    title = '【舞者穿搭】' + title + ' 👟 实战上场穿搭'
  } else if (post.cat === 'contest') {
    title = '【赛事情报】' + title + ' 🏆 比赛资讯'
  } else if (post.cat === 'master') {
    title = '【大师课】' + title + ' 🎧 圈内老师亲授'
  } else if (post.cat === 'studio') {
    title = '【舞室测评】' + title + ' 🏠 真实口碑避坑'
  } else {
    title = '【' + catName + '】' + title
  }

  // 优先取文章第一张渲染图/封面；无高质图时回退到分类专属视觉封面
  let img = post.coverUrl
  if (!isUsableCover(img) && post.images && post.images.length > 0) {
    img = post.images[0]
  }
  if (!isUsableCover(img)) {
    img = CAT_SHARE_COVER[post.cat] || DEFAULT_COVERS.official
  }

  return {
    title: title,
    path: '/pages/post-detail/post-detail?id=' + post.id,
    imageUrl: img
  }
}

/** 3. 活动/练舞局分享卡片文案与图片 */
function shareCardForActivity(act) {
  if (!act) {
    return {
      title: '舞岛 · 同城街舞活动与练舞局',
      path: '/pages/activities/activities',
      imageUrl: DEFAULT_COVERS.practice
    }
  }

  let title = act.title || '同城街舞局'
  const city = act.city || '同城'
  const time = act.timeLabel || act.dateText || ''

  if (act.type === 'buddy') {
    if (act.buddySubType === 'teammate') {
      title = '🤝 [' + city + '找队友] ' + title + '！有兴趣速联系'
    } else if (act.buddySubType === 'group') {
      title = '🔥 [' + city + '拼团大师课] ' + title + '，还差几人！'
    } else {
      title = '⚡ [' + city + '练舞搭子] ' + title + '，一起练舞进圈！'
    }
  } else if (act.type === 'contest') {
    title = '🏆 [' + city + '赛事] ' + title + (time ? ' (' + time + ')' : '')
  } else if (act.type === 'master') {
    title = '🎓 [' + city + '大师课] ' + title + ' 提前约课'
  } else if (act.type === 'jam') {
    title = '🪩 [' + city + 'Jam/Cypher] ' + title + ' 今晚炸场！'
  } else {
    title = '🔥 [' + city + '官方活动] ' + title
  }

  const img = shareImageForActivity(act)

  return {
    title: title,
    path: '/pages/activity-detail/activity-detail?id=' + act.id,
    imageUrl: img
  }
}

/** 4. 街舞人格测试分享卡片文案与图片 */
function shareCardForPersona(result) {
  let title = '测测你的街舞人格 ➔ 10个场景测出你在圈里的样子 🎧'
  if (result && result.persona && result.persona.name) {
    const name = result.persona.name
    const headline = result.persona.headline ? result.persona.headline.replace(/[“”]/g, '') : ''
    const titles = [
      '我是「' + name + '」：' + headline,
      '在舞岛测出了「' + name + '」，来看看你是哪种街舞人格 ⚡',
      '“' + headline + '” —— 我是' + name + '，测测你的街舞 DNA 🎧'
    ]
    title = titles[Math.floor(Math.random() * titles.length)]
  }

  return {
    title: title,
    path: '/pages/persona-test/persona-test',
    imageUrl: DEFAULT_COVERS.official
  }
}

function shareImageForPost(post) {
  const card = shareCardForPost(post)
  return card.imageUrl
}

function shareImageForActivity(act) {
  return getDefaultCover(act && act.type, act && act.buddySubType)
}

module.exports = {
  DEFAULT_COVERS,
  getDefaultCover,
  withDefaultCover,
  isUsableCover,
  shareImageForPost,
  shareImageForActivity,
  homeShareCard,
  shareCardForPost,
  shareCardForActivity,
  shareCardForPersona
}
