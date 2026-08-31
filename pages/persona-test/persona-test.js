const DATA = require('./persona-data.js')
const PERSONAS = DATA.PERSONAS
const QUESTIONS = DATA.QUESTIONS
const FEAR_KEEP_PAIRS = DATA.FEAR_KEEP_PAIRS
const SCENE_RECOMMEND = DATA.SCENE_RECOMMEND

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

function pickByKind(picks, kind) {
  for (var i = 0; i < QUESTIONS.length; i++) {
    if (QUESTIONS[i].kind === kind) return picks[i]
  }
  return null
}

function fearKeepAligned(fearId, keepId) {
  return !!fearId && FEAR_KEEP_PAIRS[fearId] === keepId
}

/**
 * 结果正文 = 人格底色 + 前三题的具体选择 + 结尾的「怕什么 / 留什么」因果句。
 * 每一句都能追溯到某个选项，不写与作答无关的话。
 */
function buildReading(persona, subPersona, picks, music, scenes) {
  var lines = []
  if (persona.voice) lines.push(persona.voice)

  var body = []
  for (var i = 0; i < 3; i++) {
    if (picks[i] && picks[i].echo) body.push(picks[i].echo)
  }
  if (body.length) lines.push(body.join(''))

  var fear = pickByKind(picks, 'fear')
  var keep = pickByKind(picks, 'keep')
  if (fear && keep && fear.echo && keep.echo) {
    lines.push(fearKeepAligned(fear.id, keep.id)
      ? fear.echo + '所以到最后，' + keep.echo.replace('到最后你愿意留下的，是', '你要留下的就是')
      : fear.echo + keep.echo)
  } else if (keep && keep.echo) {
    lines.push(keep.echo)
  }

  var tail = '副线是「' + ((subPersona && subPersona.name) || '律动信徒') + '」。'
  if (music && music.length) tail += '这不是猜的：第一题你选的就是 ' + music.join('、') + '。'
  if (scenes && scenes.length) tail += '你更常出现在' + scenes.join('、') + '。'
  lines.push(tail)
  return lines
}

function buildNeed(persona, scenes) {
  var recs = uniqueList((scenes || []).map(function (s) { return SCENE_RECOMMEND[s] }).filter(Boolean))
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
    posterImgPath: '',
    posterGenerating: false
  },

  onLoad() {
    // 结果缓存很小但仍改为异步读取，避免进入页面时阻塞首屏
    wx.getStorage({
      key: 'wudao_persona_result',
      success: (res) => {
        var cached = res.data
        if (!cached || !cached.persona || !PERSONAS[cached.persona.key]) return
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
      }
    })
  },

  onShow() {
    try {
      require('../../utils/share').enableShareMenu()
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

    // 不阻塞结果页首屏；结果展示完成后再写入缓存
    wx.setStorage({
      key: 'wudao_persona_result',
      data: result
    })
    this.setData({ result: result, phase: 'result', posterImgPath: '' })
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
      posterGenerating: false,
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
    if (!result || !result.persona || this.data.posterGenerating) return
    this.setData({ posterGenerating: true })

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
            that.setData({ posterImgPath: res.tempFilePath, posterGenerating: false })
          },
          fail: function (err) {
            that.setData({ posterGenerating: false })
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
  },

  sharePayload() {
    var result = this.data.result
    var imageUrl = this.data.posterImgPath || '/images/covers/persona-test-share.jpg'
    if (this.data.phase === 'result' && result && result.persona) {
      return {
        title: '我测出是「' + result.persona.name + '」｜你是圈里哪一种？',
        path: '/pages/persona-test/persona-test',
        imageUrl: imageUrl
      }
    }
    return {
      title: '9 题测出你的街舞人格 | 野火玩家、独行者，还是圈外人？',
      path: '/pages/persona-test/persona-test',
      imageUrl: '/images/covers/persona-test-share.jpg'
    }
  },

  onShareAppMessage() {
    return this.sharePayload()
  },

  onShareTimeline() {
    var card = this.sharePayload()
    return {
      title: card.title,
      query: '',
      imageUrl: card.imageUrl
    }
  }
})
