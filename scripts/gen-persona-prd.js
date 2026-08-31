/**
 * 从 pages/persona-test/persona-data.js 生成 PRD 的 §7.2–§7.4，
 * 覆写 docs/舞岛MMVP-PRD-非社区版.md 中 "### 7.2" 到 "### 7.5" 之间的内容。
 * 题库改动后重跑本脚本，文档与代码不会走散。
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = require(path.join(ROOT, 'pages/persona-test/persona-data.js'))
const MD = path.join(ROOT, 'docs/舞岛MMVP-PRD-非社区版.md')

const { PERSONAS, QUESTIONS, FEAR_KEEP_PAIRS, SCENE_RECOMMEND } = DATA

const keys = Object.keys(PERSONAS)
const LETTER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

function weightsText(w) {
  return Object.keys(w).map(function (k) {
    return k + ' +' + w[k]
  }).join('，')
}

function cell(v) {
  return (Array.isArray(v) ? v.join('、') : v) || '—'
}

const out = []

out.push('### 7.2 人格图谱与固定文案')
out.push('')
out.push('结果为 **' + keys.length + ' 选 1** 主人格，附 1 个副人格。人格按**动机**切分：每个人格必须能回答「只有这种人会做的那件事是什么」，否则不新增。')
out.push('')
out.push('下表为**随主人格固定出现**的文案（headline / voice / superpower / shadow / 默认 traits / need 兜底）；结果页其余段落由作答 echo 动态拼接，见 §7.4。')
out.push('')
out.push('| 编号 | key | 中文名 | 英文名 | 核心 | 一句话区分 |')
out.push('|---|---|---|---|---|---|')
keys.forEach(function (k) {
  const p = PERSONAS[k]
  out.push('| ' + p.no + ' | ' + k + ' | ' + p.name + ' | ' + p.enName + ' | ' + p.core + ' | ' + p.headline + ' |')
})
out.push('')

keys.forEach(function (k) {
  const p = PERSONAS[k]
  out.push('#### ' + p.no.replace('NO. ', 'NO.') + ' ' + p.name)
  out.push('')
  out.push('| 字段 | 文案 |')
  out.push('|---|---|')
  out.push('| headline（海报金句） | ' + p.headline + ' |')
  out.push('| voice（解读第 1 段） | ' + p.voice + ' |')
  out.push('| superpower（你的天赋） | ' + p.superpower + ' |')
  out.push('| shadow（你的暗面） | ' + p.shadow + ' |')
  out.push('| 默认 traits | ' + p.traits.join(' / ') + ' |')
  out.push('| need 兜底 | ' + p.need + ' |')
  out.push('')
})

out.push('### 7.3 题目与计分规则')
out.push('')
const counts = QUESTIONS.map(function (q) { return q.options.length })
const minC = Math.min.apply(null, counts)
const maxC = Math.max.apply(null, counts)
out.push('**' + QUESTIONS.length + ' 道场景题**，每题 ' + minC + '–' + maxC + ' 个选项（选项数按人格覆盖需要给，不强行凑齐 4 个）。刻意用场景题而非直问（「你喜欢编舞吗」会让人按身份作答）。')
out.push('')
out.push('每个选项携带：`weights`（人格分）/ `music`（仅 Q1）/ `body` / `scenes` / `roles` / `echo`（写入结果解读）。')
out.push('')
out.push('**总分算法**：')
out.push('')
out.push('1. 人格分：' + QUESTIONS.length + ' 题 `weights` 累加。主人格 = 第 1 名；副人格 = 第 2 名。')
out.push('2. 同分：按对象 key 字符串排序后取先者（无专门平局处理）。')
out.push('3. 全空兜底：主 `resonance`，副 `groove`。')
out.push('4. 音乐 DNA：只累计 **Q1** 的 `music`，取 Top（实际即该选项的 1–2 个标签）。')
out.push('5. 身体语言 / 常在战场 / 角色：各题对应标签每命中 +1，分别取 Top2 / Top3 / Top2。')
out.push('')
out.push('**题目定位**：题目携带 `kind` 标记（`music` / `fear` / `keep`），结果文案按 `kind` 取答案而非按下标，增删题目不会让文案错位。')
out.push('')

// 平衡性自检
const maxScore = {}
keys.forEach(function (k) { maxScore[k] = 0 })
QUESTIONS.forEach(function (q) {
  const best = {}
  q.options.forEach(function (o) {
    Object.keys(o.weights).forEach(function (k) {
      best[k] = Math.max(best[k] || 0, o.weights[k])
    })
  })
  Object.keys(best).forEach(function (k) { maxScore[k] += best[k] })
})
out.push('**权重平衡自检**（每个人格的理论最高分，用于确认没有人格不可达）：')
out.push('')
out.push('| 人格 | 理论最高分 |')
out.push('|---|---|')
keys.slice().sort(function (a, b) { return maxScore[b] - maxScore[a] }).forEach(function (k) {
  out.push('| ' + PERSONAS[k].name + ' | ' + maxScore[k] + ' |')
})
out.push('')

QUESTIONS.forEach(function (q, qi) {
  out.push('#### Q' + (qi + 1) + ' ' + q.title)
  out.push('')
  if (q.kind === 'music') out.push('> 本题是**唯一**写入音乐 DNA 的题。')
  if (q.kind === 'fear') out.push('> 本题为「怕」端，与 Q' + QUESTIONS.length + ' 组成结尾因果句。')
  if (q.kind === 'keep') out.push('> 本题为「留」端，权重最重，用于拉开难分的局。')
  if (q.kind) out.push('')
  const hasMusic = q.kind === 'music'
  out.push('| 选项 | 题面 | 人格分 |' + (hasMusic ? ' 音乐 DNA |' : '') + ' 身体 | 战场 | 角色 | 结果 echo |')
  out.push('|---|---|---|' + (hasMusic ? '---|' : '') + '---|---|---|---|')
  q.options.forEach(function (o, oi) {
    out.push('| ' + LETTER[oi] + ' | ' + o.text + ' | ' + weightsText(o.weights) + ' |' +
      (hasMusic ? ' ' + cell(o.music) + ' |' : '') +
      ' ' + cell(o.body) + ' | ' + cell(o.scenes) + ' | ' + cell(o.roles) + ' | ' + o.echo + ' |')
  })
  out.push('')
})

out.push('### 7.4 结果页完整文案结构')
out.push('')
out.push('结果页不是套死一段人格简介，而是 **固定块 + 作答拼接块**：')
out.push('')
out.push('| 区块 | 来源 | 是否随作答变化 |')
out.push('|---|---|---|')
out.push('| 票根编号 / 中英文名 / 核心特质 | 主人格表 | 否（随主人格） |')
out.push('| headline 金句 | 主人格 `headline` | 否 |')
out.push('| 解读第 1 段 | 主人格 `voice` | 否 |')
out.push('| 解读第 2 段 | **Q1 / Q2 / Q3 命中选项的 echo 连写** | 是 |')
out.push('| 解读第 3 段 | **`kind=fear` echo + `kind=keep` echo** | 是 |')
out.push('| 解读末段 | 副人格名 + Q1 音乐标签 + Top 战场 | 是 |')
out.push('| 你的天赋 | 主人格 `superpower` | 否 |')
out.push('| 你的暗面 | 主人格 `shadow` | 否 |')
out.push('| 标签 chips | `核心 + Top2 战场 + Top1 身体 + 默认 traits`，去重取 4 | 部分 |')
out.push('| 4 格 DNA | 音乐 / 身体 / 战场 / 副人格名 | 是 |')
out.push('| 岛上推荐 | `按你选过的场景，更适合先去：{映射}。` + 主人格 `need` | 部分 |')
out.push('')
out.push('> 「天赋 + 暗面」是分享率最高的两块：天赋给人转发的理由，暗面给人「被说中了」的刺痛感。两者都随主人格固定，保证同一人格的文案在传播中可被辨认。')
out.push('')

const fearQ = QUESTIONS.find(function (q) { return q.kind === 'fear' })
const keepQ = QUESTIONS.find(function (q) { return q.kind === 'keep' })
out.push('**「怕什么 → 留什么」连接规则**（语义对齐才用「所以」，否则并列、不硬圆）：')
out.push('')
out.push('| 怕（Q' + (QUESTIONS.indexOf(fearQ) + 1) + '） | 留（Q' + (QUESTIONS.indexOf(keepQ) + 1) + '） | 是否对齐 |')
out.push('|---|---|---|')
fearQ.options.forEach(function (fo, fi) {
  const keepId = FEAR_KEEP_PAIRS[fo.id]
  if (!keepId) return
  const ki = keepQ.options.findIndex(function (x) { return x.id === keepId })
  if (ki < 0) return
  out.push('| ' + LETTER[fi] + ' ' + fo.text + ' | ' + LETTER[ki] + ' ' + keepQ.options[ki].text + ' | 是 |')
})
out.push('| 其余组合 | — | 否 → 两句直接相连 |')
out.push('')
out.push('对齐时输出：`{怕 echo}` + 「所以到最后，」+ `{留 echo}`（留句首自动改写为「你要留下的就是」）。')
out.push('')
out.push('**场景 → 推荐映射**（去重后拼接在 need 前）：')
out.push('')
out.push('| scenes | 推荐短句 |')
out.push('|---|---|')
Object.keys(SCENE_RECOMMEND).forEach(function (s) {
  out.push('| ' + s + ' | ' + SCENE_RECOMMEND[s] + ' |')
})
out.push('')
out.push('**末段模板**：`副线是「{副人格中文名}」。这不是猜的：第一题你选的就是 {音乐标签用顿号连接}。你更常出现在{战场用顿号连接}。`')
out.push('')

const md = fs.readFileSync(MD, 'utf8')
const start = md.indexOf('### 7.2')
const end = md.indexOf('### 7.5')
if (start < 0 || end < 0 || end < start) {
  console.error('未找到 §7.2 / §7.5 锚点')
  process.exit(1)
}
fs.writeFileSync(MD, md.slice(0, start) + out.join('\n') + md.slice(end))
console.log('PRD §7.2–§7.4 已更新：' + keys.length + ' 人格 / ' + QUESTIONS.length + ' 题 / ' + counts.reduce(function (a, b) { return a + b }, 0) + ' 选项')
