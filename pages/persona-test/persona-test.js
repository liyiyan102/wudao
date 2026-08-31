const PERSONAS = {
  storyteller: {
    name: '光影叙事者',
    enName: 'CHOREO STORYTELLER',
    no: 'NO. 01',
    mark: 'STAGE',
    core: '表达',
    headline: '有些句子说不出口，就让停顿替你说。',
    voice: '你盯的不是动作堆得满不满，是这一拍为什么必须出现在这里。',
    traits: ['编舞', '成片', '舞台', '表达'],
    need: '成片课、作品打磨、舞台向课程，会比纯炸场更对你的胃口。'
  },
  wildfire: {
    name: '野火上场者',
    enName: 'WILDFIRE FREESTYLER',
    no: 'NO. 02',
    mark: 'FIRE',
    core: '爆发',
    headline: '圈刚空出来，你的身体已经点头了。',
    voice: '你享受没有标准答案的那一秒。不一定要赢，但你很少愿意只站在外面看。',
    traits: ['Freestyle', '爆发', '即兴', '上场欲'],
    need: '即兴局、Battle 体验、Freestyle 练习，适合找敢一起进圈的人。'
  },
  tactician: {
    name: '锋芒执局者',
    enName: 'BATTLE TACTICIAN',
    no: 'NO. 03',
    mark: 'BATTLE',
    core: '对抗',
    headline: '你上场，不是去碰运气。',
    voice: '收和放对你来说都是选择。真正上瘾的，是下一轮你知道可以怎么拆。',
    traits: ['Battle', '策略', '复盘', '胜负脑'],
    need: '赛事、对抗训练、一轮一轮的复盘，比漫无目的的派对更喂得饱你。'
  },
  resonance: {
    name: '共振递火者',
    enName: 'RESONANCE IGNITER',
    no: 'NO. 04',
    mark: 'CYPHER',
    core: '连接',
    headline: '一个人练得再顺，也换不来被接住的那下。',
    voice: '你要的不是陪练，是有人接你的东西，你再把火递回去。',
    traits: ['一起练舞', '接歌', '熟人局', '互相激发'],
    need: '熟人练舞局、小型 Cypher、找搭子，会比一个人死磕更让你亮起来。'
  },
  nomad: {
    name: '夜色游牧者',
    enName: 'NIGHT PARTY NOMAD',
    no: 'NO. 05',
    mark: 'NIGHT',
    core: '自由',
    headline: '灯一暗，陌生房间也会变成你的。',
    voice: '你追的不是热闹本身，是人和音乐撞在一起以后，突然可以自由的那一阵。',
    traits: ['Party', 'Club', '社交舞感', '现场'],
    need: '派对、夜场、House / Waacking / Afro 这类把房间推起来的局。'
  },
  lone: {
    name: '月下独行者',
    enName: 'SOLO ORBIT DANCER',
    no: 'NO. 06',
    mark: 'SOLO',
    core: '独处',
    headline: '耳机一戴，世界就刚好够用。',
    voice: '你不是不合群，是有些东西必须一个人消化完，才会真正变成你的。',
    traits: ['独练', '耳机', '深夜', '自我消化'],
    need: '安静练舞时段、基础训练、康复内容；搭子要能同行，但不必一直说话。'
  },
  groove: {
    name: '律动信徒',
    enName: 'GROOVE BELIEVER',
    no: 'NO. 07',
    mark: 'GROOVE',
    core: '音乐',
    headline: '难不难先放一边，groove 对了才算数。',
    voice: '别人看动作，你听音乐。一个简单的 step，只要身体进了歌里，你就会忍不住点头。',
    traits: ['Groove', 'Foundation', 'Old School', '音乐性'],
    need: '文化内容、Foundation、音乐理解课，会比只追难度更对症。'
  },
  stylekeeper: {
    name: '风格藏家',
    enName: 'TEXTURE COLLECTOR',
    no: 'NO. 08',
    mark: 'STYLE',
    core: '风格',
    headline: '别人一眼滑过去的东西，你会留下来。',
    voice: '重量、肩膀、眼神的角度——你收藏细节，像在收藏以后会变成自己的味道。',
    traits: ['质感', '线条', '审美', 'Texture'],
    need: '风格向课程、穿搭、成片复盘，适合找能互相看动作质感的人。'
  },
  wanderer: {
    name: '舞房游学生',
    enName: 'CLASSROOM WANDERER',
    no: 'NO. 09',
    mark: 'CLASS',
    core: '探索',
    headline: '你去上课，是去偷一点还没长在自己身上的东西。',
    voice: '这个老师的律动很特别就去，那个老师的脚法很干净也去。心动过的东西，你相信会留下。',
    traits: ['上课', 'Workshop', '跨舞种', '探索'],
    need: '舞室测评、大师课、体验课、拼团——你需要不断换教室，带走新的一块。'
  },
  watcher: {
    name: '静默观舞者',
    enName: 'SILENT OBSERVER',
    no: 'NO. 10',
    mark: 'WATCH',
    core: '观察',
    headline: '你不一定站在圈中间，但你看得很认真。',
    voice: '你看的不是热闹和输赢，是这个动作从哪来、为什么这样跳。看，也是一种靠近。',
    traits: ['观赛', '文化', '审美', '观察'],
    need: '赛事解说、文化长文、观赛活动。你可以先看懂一场，再决定什么时候上场。'
  }
}

const QUESTIONS = [
  {
    title: '耳机里最近循环最多的，更像哪一类？',
    options: [
      opt('a', 'Funk / Boom bap：鼓点和 bounce 先把身体叫醒', { groove: 2, wildfire: 1 }, ['Funk', 'Boom bap'], ['Groove'], ['即兴局'], ['Player'], '音乐上你认 Funk、Boom bap——鼓点一响，你先问身体醒了没有。'),
      opt('b', 'R&B / Soul：旋律和情绪能讲出故事', { storyteller: 2, stylekeeper: 1 }, ['R&B', 'Soul'], ['Line'], ['成片'], ['Creator'], '音乐上你认 R&B、Soul——旋律先开口，你会把歌听成一段故事。'),
      opt('c', 'House / Afro：bass 和空间把房间推开', { nomad: 2, resonance: 1 }, ['House', 'Afro'], ['Flow'], ['Party'], ['Connector'], '音乐上你认 House、Afro——你先感觉房间被 bass 推开了没有。'),
      opt('d', 'Breaks / Battle Beat：能把场子点燃的那一截', { wildfire: 1, tactician: 2 }, ['Breaks', 'Battle Beat'], ['Power'], ['Battle'], ['Player'], '音乐上你认 Breaks、Battle Beat——你要的是能把场子点燃的那一截。')
    ]
  },
  {
    title: '今晚突然多出 2 小时，你更想怎么用？',
    options: [
      opt('a', '一个人租房，把最近卡住的动作磨顺', { lone: 2, groove: 1 }, [], ['Control'], ['独练'], ['Student'], '多出两小时，你更想一个人把卡住的动作磨顺——不是躲起来，是要把东西真正练进身体。'),
      opt('b', '约 2、3 个朋友，放歌轮流跳', { resonance: 3 }, [], ['Freestyle'], ['朋友练舞'], ['Connector'], '多出两小时，你会约两三个朋友轮流跳。对你来说，练舞局本身就是答案。'),
      opt('c', '去即兴局看看，说不定能碰到有意思的人', { wildfire: 2, watcher: 1 }, [], ['Freestyle'], ['即兴局'], ['Player'], '多出两小时，你想去即兴局看看。不一定今晚就炸，但你想碰上有意思的人。'),
      opt('d', '报一节课，让老师系统带一遍', { wanderer: 2, groove: 1 }, [], ['Foundation'], ['课堂'], ['Student'], '多出两小时，你更想上一节课，让老师把东西系统带过一遍。')
    ]
  },
  {
    title: '你最想拥有哪种高光时刻？',
    options: [
      opt('a', 'Battle 里一轮把场子点燃', { wildfire: 2, tactician: 1 }, [], ['Power'], ['Battle'], ['Player'], '你幻想过的高光，是 Battle 里一轮把场子点燃。'),
      opt('b', '作品成片里一个眼神刚好对上音乐', { storyteller: 2, stylekeeper: 1 }, [], ['Texture'], ['成片'], ['Creator'], '你要的高光很安静：成片里一个眼神刚好踩上音乐。'),
      opt('c', '派对里所有人一起进入同一个 groove', { nomad: 2, resonance: 1 }, [], ['Groove'], ['Party'], ['Connector'], '你觉得最动人的，是派对里所有人掉进同一个 groove。'),
      opt('d', '一个人练到某个东西终于通了', { lone: 2, groove: 1 }, [], ['Control'], ['独练'], ['Student'], '你真正会记得的，是一个人练到某个东西突然通了的夜晚。')
    ]
  },
  {
    title: '朋友突然发消息：“晚上来练不？”',
    options: [
      opt('a', '谁来？几点？在哪儿？我看下鞋', { resonance: 3 }, [], ['Freestyle'], ['朋友练舞'], ['Connector'], '朋友一喊「来练不」，你已经在问谁来、几点、在哪儿——鞋都准备好了。'),
      opt('b', '今天想自己消化一下，上次那段还没顺', { lone: 2, groove: 1 }, [], ['Control'], ['独练'], ['Student'], '朋友喊你时，你更想先把自己卡住的那段消化完。'),
      opt('c', '有人拍吗？我想把这段录出来', { storyteller: 2, stylekeeper: 1 }, [], ['Line'], ['成片'], ['Creator'], '你答应之前会先问：有人拍吗？你想把今晚变成一段能留下的东西。'),
      opt('d', '练什么？有老师或者主题吗？', { wanderer: 2, tactician: 1 }, [], ['Foundation'], ['课堂'], ['Teacher'], '你先问练什么、有没有老师或主题。对你来说，没结构的局会有点空。')
    ]
  },
  {
    title: '你觉得 Cypher 最爽的瞬间是什么？',
    options: [
      opt('a', '一轮下来，把所有目光拉到自己身上', { wildfire: 2, tactician: 1 }, [], ['Power'], ['Battle'], ['Player'], 'Cypher 里你最爽的，是一轮之后目光都在你身上。'),
      opt('b', '有人接住我的东西，我又接回他的', { resonance: 3 }, [], ['Freestyle'], ['Cypher'], ['Connector'], '你要的不是独舞，是有人接住你，你再接回去。'),
      opt('c', '看到一个高手突然炸场，想知道他怎么做到的', { watcher: 2, wanderer: 1 }, [], ['Observe'], ['观赛'], ['Observer'], '你站在圈边也能兴奋：看到高手炸场，你会想把它拆开看。'),
      opt('d', '拍到一个特别炸的瞬间，回去反复看', { stylekeeper: 2, storyteller: 1 }, [], ['Texture'], ['成片'], ['Creator'], '你下意识会把炸的瞬间拍下来，回去反复看——那是你收藏风格的方式。')
    ]
  },
  {
    title: '上课时，你更像哪一种？',
    options: [
      opt('a', '站前排吸收细节，越拆越兴奋', { wanderer: 2, groove: 1 }, [], ['Foundation'], ['课堂'], ['Student'], '上课你站前排，拆得越细越兴奋。'),
      opt('b', '站后排也没关系，我要先在脑子里过一遍', { lone: 2, tactician: 1 }, [], ['Control'], ['独练'], ['Student'], '你宁可先站后排，让动作在脑子里过一遍再交给身体。'),
      opt('c', '一下课就想问老师：这个到底怎么练？', { wanderer: 2, stylekeeper: 1 }, [], ['Texture'], ['课堂'], ['Student'], '一下课你就会追问：这个到底怎么练？你要的是能带走的方法。'),
      opt('d', '会本能看别人哪里没懂，顺手帮人补两句', { groove: 1, stylekeeper: 1, wanderer: 1 }, [], ['Foundation'], ['课堂'], ['Teacher'], '你会看见别人卡住，顺手补两句。教和学，在你这儿经常叠在一起。')
    ]
  },
  {
    title: '你更容易被哪种舞打动？',
    options: [
      opt('a', '一招出来，全场“哇”', { wildfire: 2, tactician: 1 }, [], ['Power'], ['Battle'], ['Player'], '最打动你的舞，是一招出来全场哇的那种。'),
      opt('b', '线条、质感、表情刚刚好', { stylekeeper: 2, storyteller: 1 }, [], ['Line'], ['舞台'], ['Creator'], '线条、质感、表情刚刚好，比难度更能打中你。'),
      opt('c', '动作不多，但整个人都在音乐里', { groove: 2, nomad: 1 }, [], ['Groove'], ['即兴局'], ['Player'], '动作不多也没关系，人要在音乐里。'),
      opt('d', '大家一起跳，那个场子突然活了', { resonance: 2, nomad: 1 }, [], ['Flow'], ['朋友练舞'], ['Connector'], '大家一起跳、场子突然活了，比个人高光更让你动容。')
    ]
  },
  {
    title: '你和音乐的关系更像？',
    options: [
      opt('a', '我想赢过它，把这一轮拿下来', { tactician: 2, wildfire: 1 }, [], ['Power'], ['Battle'], ['Player'], '你和音乐的关系像对局：你想赢过这一轮。'),
      opt('b', '我想讲出它，把情绪放进动作里', { storyteller: 2, stylekeeper: 1 }, [], ['Line'], ['成片'], ['Creator'], '你想把情绪讲进动作里，音乐是你的台词。'),
      opt('c', '我想住进它，让身体慢慢被它带走', { groove: 2, lone: 1 }, [], ['Groove'], ['独练'], ['Student'], '你更想住进音乐里，让身体慢慢被带走。'),
      opt('d', '我想把别人也拉进去，让场子一起动', { nomad: 2, resonance: 1 }, [], ['Flow'], ['Party'], ['Crew'], '你想把旁边的人也拉进歌里，让整间房一起动。')
    ]
  },
  {
    title: '你最怕别人说你？',
    options: [
      opt('a', '没音乐性', { groove: 2, lone: 1 }, [], ['Groove'], ['课堂'], ['Player'], '你最怕被说没音乐性。'),
      opt('b', '没味儿', { stylekeeper: 2, storyteller: 1 }, [], ['Texture'], ['舞台'], ['Creator'], '你最怕被说没味儿。'),
      opt('c', '没胆上', { wildfire: 2, tactician: 1 }, [], ['Power'], ['Battle'], ['Player'], '你最怕被说没胆上。'),
      opt('d', '不会接别人，也带不起气氛', { resonance: 2, nomad: 1 }, [], ['Freestyle'], ['Cypher'], ['Connector'], '你最怕自己不会接别人、也带不起气氛。')
    ]
  },
  {
    title: '最后，只能留下一个东西。',
    options: [
      opt('a', '一首让你循环到天亮的歌', { lone: 2, groove: 2 }, [], ['Groove'], ['独练'], ['Student'], '到最后你愿意留下的，是一首能循环到天亮的歌。'),
      opt('b', '一个有人接你的练舞圈', { resonance: 4 }, [], ['Freestyle'], ['朋友练舞'], ['Connector'], '到最后你愿意留下的，是一个有人接你的练舞圈。'),
      opt('c', '一个让你上场的机会', { wildfire: 2, tactician: 2 }, [], ['Power'], ['Battle'], ['Player'], '到最后你愿意留下的，是一个能让你上场的机会。'),
      opt('d', '一段终于被拍出来的作品', { storyteller: 2, stylekeeper: 2 }, [], ['Line'], ['成片'], ['Creator'], '到最后你愿意留下的，是一段终于被拍出来的作品。')
    ]
  }
]

function opt(id, text, weights, music, body, scenes, roles, echo) {
  return {
    id: id,
    text: text,
    weights: weights || {},
    music: music || [],
    body: body || [],
    scenes: scenes || [],
    roles: roles || [],
    echo: echo || ''
  }
}

function addScores(target, keys, points) {
  ;(keys || []).forEach(function (key) {
    target[key] = (target[key] || 0) + (points || 1)
  })
}

function topKeys(scores, limit) {
  return Object.keys(scores).sort(function (a, b) {
    return scores[b] - scores[a]
  }).slice(0, limit)
}

function uniqueList(list) {
  var seen = {}
  return (list || []).filter(function (item) {
    if (!item || seen[item]) return false
    seen[item] = true
    return true
  })
}

function fearKeepAligned(fearId, keepId) {
  return (fearId === 'a' && keepId === 'a') ||
    (fearId === 'b' && keepId === 'd') ||
    (fearId === 'c' && keepId === 'c') ||
    (fearId === 'd' && keepId === 'b')
}

function buildReading(persona, subPersona, picks, music, scenes) {
  var lines = []
  if (persona.voice) lines.push(persona.voice)
  if (picks[0] && picks[0].echo) lines.push(picks[0].echo)
  if (picks[1] && picks[1].echo) lines.push(picks[1].echo)
  if (picks[2] && picks[2].echo) lines.push(picks[2].echo)

  var fear = picks[8]
  var keep = picks[9]
  if (fear && keep && fear.echo && keep.echo) {
    if (fearKeepAligned(fear.id, keep.id)) {
      lines.push(fear.echo + '所以，' + keep.echo)
    } else {
      lines.push(fear.echo + keep.echo)
    }
  } else if (keep && keep.echo) {
    lines.push(keep.echo)
  }

  var tail = '副线是「' + ((subPersona && subPersona.name) || '律动信徒') + '」。'
  if (music && music.length) tail += '这不是猜的：第一题你选的就是' + music.join('、') + '。'
  if (scenes && scenes.length) tail += '你更常出现在' + scenes.join('、') + '。'
  lines.push(tail)
  return lines
}

function buildNeed(persona, scenes) {
  var map = {
    '成片': '成片和作品打磨',
    '朋友练舞': '熟人练舞局和找搭子',
    '即兴局': '即兴局和 Freestyle',
    'Battle': '赛事与对抗训练',
    'Party': '派对和现场',
    '独练': '安静练舞时段',
    '课堂': '大师课和系统课',
    'Cypher': '小型 Cypher',
    '观赛': '观赛和文化内容',
    '舞台': '舞台向课程'
  }
  var recs = uniqueList((scenes || []).map(function (s) { return map[s] }).filter(Boolean))
  if (!recs.length) return persona.need
  return '按你选过的场景，更适合先去：' + recs.join('、') + '。' + persona.need
}

function wrapFillText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  var chars = String(text || '').split('')
  var line = ''
  var lines = []
  chars.forEach(function (ch) {
    var test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else {
      line = test
    }
  })
  if (line) lines.push(line)
  if (maxLines) lines = lines.slice(0, maxLines)
  lines.forEach(function (ln, idx) {
    ctx.fillText(ln, x, y + idx * lineHeight)
  })
  return lines.length
}

/** 辅助绘图：圆角矩形 */
function drawRoundRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
  if (fillStyle) {
    ctx.fillStyle = fillStyle
    ctx.fill()
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle
    ctx.stroke()
  }
  ctx.restore()
}

/** 辅助绘图：精细模拟潮流二维码区 */
function drawQRCode(ctx, x, y, size) {
  ctx.save()
  // 二维码黑金底框
  drawRoundRect(ctx, x, y, size, size, 12, '#0A0A0E', '#E2FF00')

  // 四角 L 型 [ SCAN ME ] 定位框
  ctx.strokeStyle = '#E2FF00'
  ctx.lineWidth = 4
  const len = 16

  // 左上
  ctx.beginPath()
  ctx.moveTo(x - 6, y - 6 + len)
  ctx.lineTo(x - 6, y - 6)
  ctx.lineTo(x - 6 + len, y - 6)
  ctx.stroke()

  // 右上
  ctx.beginPath()
  ctx.moveTo(x + size + 6 - len, y - 6)
  ctx.lineTo(x + size + 6, y - 6)
  ctx.lineTo(x + size + 6, y - 6 + len)
  ctx.stroke()

  // 左下
  ctx.beginPath()
  ctx.moveTo(x - 6, y + size + 6 - len)
  ctx.lineTo(x - 6, y + size + 6)
  ctx.lineTo(x - 6 + len, y + size + 6)
  ctx.stroke()

  // 右下
  ctx.beginPath()
  ctx.moveTo(x + size + 6 - len, y + size + 6)
  ctx.lineTo(x + size + 6, y + size + 6)
  ctx.lineTo(x + size + 6, y + size + 6 - len)
  ctx.stroke()

  // 绘制标准 3 个 Finder Pattern 码点
  function drawFinder(fx, fy) {
    // 外黑框
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(fx, fy, 32, 32)
    ctx.fillStyle = '#0A0A0E'
    ctx.fillRect(fx + 4, fy + 4, 24, 24)
    // 内亮绿心
    ctx.fillStyle = '#E2FF00'
    ctx.fillRect(fx + 8, fy + 8, 16, 16)
  }

  drawFinder(x + 10, y + 10) // 左上
  drawFinder(x + size - 42, y + 10) // 右上
  drawFinder(x + 10, y + size - 42) // 左下

  // 绘制数据微码阵
  ctx.fillStyle = '#E2FF00'
  const matrix = [
    [0,0,0,0,0,0,0, 1,1,0,1, 0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0, 0,1,0,0, 0,0,0,0,0,0,0],
    [1,0,1,1,0,1,0, 1,0,1,1, 0,1,0,1,1,0,1],
    [0,1,0,0,1,0,1, 0,1,0,0, 1,0,1,0,0,1,0],
    [1,0,1,0,1,1,0, 1,1,1,0, 0,1,0,1,0,1,1],
    [0,0,0,0,0,0,0, 0,1,0,1, 1,0,1,1,0,1,0],
    [0,0,0,0,0,0,0, 1,0,1,0, 0,1,0,0,1,0,1]
  ]

  const cellSize = 6
  const startX = x + 12
  const startY = y + 50

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        ctx.fillRect(startX + c *cellSize, startY + r * cellSize, cellSize - 1, cellSize - 1)
      }
    }
  }

  // 中心加亮圈内 Badge: "DI"
  const cx = x + size / 2
  const cy = y + size / 2
  ctx.fillStyle = '#0A0A0E'
  ctx.beginPath()
  ctx.arc(cx, cy, 18, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#E2FF00'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#E2FF00'
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('DI', cx, cy)

  ctx.restore()
}

Page({
  data: {
    phase: 'intro',
    questions: QUESTIONS,
    currentIndex: 0,
    currentQuestion: QUESTIONS[0],
    currentAnswer: '',
    answers: {},
    progress: 10,
    result: null,
    showPosterModal: false,
    posterImgPath: ''
  },

  onLoad() {
    var cached = wx.getStorageSync('wudao_persona_result')
    if (cached && cached.persona && PERSONAS[cached.persona.key]) {
      cached.musicText = cached.musicText || (cached.musicDNA || []).join(' / ')
      cached.bodyText = cached.bodyText || (cached.bodyDNA || []).join(' / ')
      cached.sceneText = cached.sceneText || (cached.scenes || []).join(' / ')
      cached.roleText = cached.roleText || (cached.roles || []).join(' / ')
      if (!cached.reading || !cached.reading.length) {
        cached.reading = PERSONAS[cached.persona.key].voice
          ? [PERSONAS[cached.persona.key].voice]
          : (cached.persona.intro || [])
      }
      if (!cached.needText) cached.needText = cached.persona.need
      cached.persona = Object.assign({}, PERSONAS[cached.persona.key], { key: cached.persona.key })
      this.setData({ result: cached, phase: 'result' })
      this.generatePoster()
    }
  },

  onShow() {
    try {
      wx.hideShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
    } catch (e) {}
  },

  startTest() {
    this.setData({
      phase: 'quiz',
      currentIndex: 0,
      currentQuestion: QUESTIONS[0],
      currentAnswer: this.data.answers[0] || '',
      progress: 10
    })
  },

  chooseOption(e) {
    var id = e.currentTarget.dataset.id
    var answers = Object.assign({}, this.data.answers)
    answers[this.data.currentIndex] = id
    this.setData({ answers: answers, currentAnswer: id })
  },

  nextQuestion() {
    if (!this.data.currentAnswer) {
      wx.showToast({ title: '先选一个最像你的', icon: 'none' })
      return
    }
    if (this.data.currentIndex >= QUESTIONS.length - 1) {
      this.finishTest()
      return
    }
    this.goIndex(this.data.currentIndex + 1)
  },

  prevQuestion() {
    if (this.data.currentIndex <= 0) return
    this.goIndex(this.data.currentIndex - 1)
  },

  goIndex(index) {
    this.setData({
      currentIndex: index,
      currentQuestion: QUESTIONS[index],
      currentAnswer: this.data.answers[index] || '',
      progress: Math.round(((index + 1) / QUESTIONS.length) * 100)
    })
  },

  finishTest() {
    var personaScores = {}
    var musicScores = {}
    var bodyScores = {}
    var sceneScores = {}
    var roleScores = {}
    var answers = this.data.answers
    var picks = []

    QUESTIONS.forEach(function (question, index) {
      var selected = (question.options || []).find(function (item) {
        return item.id === answers[index]
      })
      if (!selected) return
      picks.push(selected)
      Object.keys(selected.weights || {}).forEach(function (key) {
        personaScores[key] = (personaScores[key] || 0) + selected.weights[key]
      })
      addScores(musicScores, selected.music, 1)
      addScores(bodyScores, selected.body, 1)
      addScores(sceneScores, selected.scenes, 1)
      addScores(roleScores, selected.roles, 1)
    })

    var topPersonaKey = topKeys(personaScores, 1)[0] || 'resonance'
    var subPersonaKey = topKeys(personaScores, 2)[1] || 'groove'
    var persona = Object.assign({ key: topPersonaKey }, PERSONAS[topPersonaKey])
    var subPersona = PERSONAS[subPersonaKey]
    var result = {
      persona: persona,
      subPersonaName: subPersona ? subPersona.name : '律动信徒',
      musicDNA: topKeys(musicScores, 3),
      bodyDNA: topKeys(bodyScores, 2),
      scenes: topKeys(sceneScores, 3),
      roles: topKeys(roleScores, 2),
      createdAt: Date.now()
    }
    result.musicText = result.musicDNA.join(' / ')
    result.bodyText = result.bodyDNA.join(' / ')
    result.sceneText = result.scenes.join(' / ')
    result.roleText = result.roles.join(' / ')
    result.reading = buildReading(persona, subPersona, picks, result.musicDNA, result.scenes)
    result.needText = buildNeed(persona, result.scenes)
    result.persona.traits = uniqueList([persona.core].concat(result.scenes.slice(0, 2)).concat(result.bodyDNA.slice(0, 1)).concat(persona.traits)).slice(0, 4)

    wx.setStorageSync('wudao_persona_result', result)
    this.setData({ result: result, phase: 'result', posterImgPath: '' })
    this.generatePoster()
  },

  retake() {
    wx.removeStorageSync('wudao_persona_result')
    this.setData({
      phase: 'intro',
      answers: {},
      currentIndex: 0,
      currentQuestion: QUESTIONS[0],
      currentAnswer: '',
      progress: 10,
      result: null,
      posterImgPath: '',
      showPosterModal: false
    })
  },

  goBuddy() {
    wx.navigateTo({ url: '/pages/buddy-request/buddy-request' })
  },

  openPosterModal() {
    this.setData({ showPosterModal: true })
    if (!this.data.posterImgPath) {
      this.generatePoster()
    }
  },

  closePosterModal() {
    this.setData({ showPosterModal: false })
  },

  stopBubble() {},

  previewBigPoster() {
    if (this.data.posterImgPath) {
      wx.previewImage({ urls: [this.data.posterImgPath] })
    }
  },

  /** 绘制街舞地下地刊/黑胶发行的带二维码高精海报 */
  generatePoster() {
    var that = this
    var result = this.data.result
    if (!result || !result.persona) return

    var ctx = wx.createCanvasContext('posterCanvas', this)
    var p = result.persona

    // 画布背景 (750 * 1280)
    ctx.fillStyle = '#0A0A0E'
    ctx.fillRect(0, 0, 750, 1280)

    // 绘制灰色淡微网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.lineWidth = 1
    for (let x = 0; x < 750; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 1280)
      ctx.stroke()
    }
    for (let y = 0; y < 1280; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(750, y)
      ctx.stroke()
    }

    // 主体质感背板
    drawRoundRect(ctx, 35, 35, 680, 1210, 24, '#121217', '#2C2C3A')

    // 1. 顶栏 Ticket Bar
    ctx.fillStyle = '#E2FF00'
    ctx.font = 'bold 22px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('DANCE ISLAND // STREET MATRIX', 65, 65)

    ctx.fillStyle = '#808092'
    ctx.font = 'bold 18px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(p.no || 'NO. 01', 685, 65)

    // 虚线分割线
    ctx.strokeStyle = '#252535'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(65, 110)
    ctx.lineTo(685, 110)
    ctx.stroke()

    // 2. 核心特质 Chip
    drawRoundRect(ctx, 65, 135, 180, 36, 8, 'rgba(226, 255, 0, 0.1)', '#E2FF00')
    ctx.fillStyle = '#E2FF00'
    ctx.font = 'bold 18px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('[ 特质: ' + p.core + ' ]', 155, 153)

    // 3. 大标题 Persona Name
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 54px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(p.name, 65, 190)

    // 4. 英文名
    ctx.fillStyle = '#00F0FF'
    ctx.font = 'bold 20px monospace'
    ctx.fillText(p.enName, 65, 255)

    // 5. 核心宣言 Quote
    ctx.fillStyle = '#E2FF00'
    ctx.font = 'bold 24px sans-serif'
    wrapFillText(ctx, p.headline, 65, 295, 600, 32, 2)

    // 6. 深度解读文本框 Manifesto
    drawRoundRect(ctx, 65, 350, 620, 168, 14, '#181822', null)
    ctx.fillStyle = '#E2FF00'
    ctx.fillRect(65, 350, 8, 168)

    ctx.fillStyle = '#D0D0E2'
    ctx.font = '20px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    var readY = 368
    ;(result.reading || []).slice(0, 3).forEach(function (line) {
      var n = wrapFillText(ctx, line, 95, readY, 560, 26, 2)
      readY += n * 26 + 6
    })

    // 7. 特质芯片行 Traits
    var traitX = 65
    var traitY = 536
    ;(p.traits || []).forEach(function (t) {
      var txt = '# ' + t
      ctx.font = 'bold 18px sans-serif'
      var tw = ctx.measureText(txt).width + 30
      drawRoundRect(ctx, traitX, traitY, tw, 36, 18, '#1C1C26', '#2D2D3E')
      ctx.fillStyle = '#E2FF00'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(txt, traitX + tw / 2, traitY + 18)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      traitX += tw + 14
    })

    // 8. 4格 DNA Spec Matrix 矩阵
    var matrixY = 575
    var boxW = 298
    var boxH = 96

    function drawSpecBox(bx, by, title, val) {
      drawRoundRect(ctx, bx, by, boxW, boxH, 16, '#16161E', '#282836')
      ctx.fillStyle = '#707082'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(title, bx + 18, by + 18)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText(val || '-', bx + 18, by + 50)
    }

    drawSpecBox(65, matrixY, '🎧 音乐 DNA', result.musicText)
    drawSpecBox(387, matrixY, '🕺 身体语言', result.bodyText)
    drawSpecBox(65, matrixY + 112, '📍 常在战场', result.sceneText)
    drawSpecBox(387, matrixY + 112, '🎭 深度副人格', result.subPersonaName)

    // 9. 专属需求与推荐
    drawRoundRect(ctx, 65, 815, 620, 110, 16, 'rgba(0, 240, 255, 0.05)', 'rgba(0, 240, 255, 0.25)')
    ctx.fillStyle = '#00F0FF'
    ctx.font = 'bold 18px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('[ 岛上推荐入口 ]', 85, 832)

    ctx.fillStyle = '#D0D0E2'
    ctx.font = '20px sans-serif'
    wrapFillText(ctx, result.needText || p.need, 85, 860, 580, 26, 3)

    // 10. 二维码与扫码识别区 (QR Code Section)
    var qrY = 955
    // 分割线
    ctx.strokeStyle = '#22222E'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(65, qrY)
    ctx.lineTo(685, qrY)
    ctx.stroke()

    // 扫码区引导文字 (左侧)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 26px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('舞岛 DANCE ISLAND', 65, qrY + 28)

    ctx.fillStyle = '#E2FF00'
    ctx.font = 'bold 22px sans-serif'
    ctx.fillText('扫码/长按识别 测测你的街舞人格 ➔', 65, qrY + 70)

    ctx.fillStyle = '#606072'
    ctx.font = '16px monospace'
    ctx.fillText('STREET CULTURE & BUDDY PLATFORM', 65, qrY + 110)

    // 绘制潮流二维码 (右侧 140 * 140)
    drawQRCode(ctx, 545, qrY + 20, 140)

    // 执行 Canvas 导出
    ctx.draw(false, function () {
      setTimeout(function () {
        wx.canvasToTempFilePath({
          canvasId: 'posterCanvas',
          width: 750,
          height: 1280,
          destWidth: 1500,
          destHeight: 2560,
          success: function (res) {
            that.setData({ posterImgPath: res.tempFilePath })
          },
          fail: function (err) {
            wx.showToast({ title: '海报生成失败', icon: 'none' })
          }
        }, that)
      }, 300)
    })
  },

  /** 保存海报到相册 */
  savePosterToPhotos() {
    var path = this.data.posterImgPath
    if (!path) {
      wx.showToast({ title: '海报还在准备中...', icon: 'none' })
      return
    }
    wx.saveImageToPhotosAlbum({
      filePath: path,
      success: function () {
        wx.showToast({ title: '已保存到相册！', icon: 'success' })
      },
      fail: function (err) {
        if (err.errMsg && err.errMsg.indexOf('auth deny') >= 0) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中开启相册保存权限',
            success: function (resModal) {
              if (resModal.confirm) {
                wx.openSetting()
              }
            }
          })
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' })
        }
      }
    })
  }
})
