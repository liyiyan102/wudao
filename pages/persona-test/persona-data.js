/**
 * 街舞人格测试：人格定义与题库
 *
 * 人格切分原则：一个人格 = 一个别人替代不了的动机。
 * 新增人格必须能回答「只有这种人会做的那件事是什么」，否则不加。
 */
const PERSONAS = {
  storyteller: {
    name: '舞台编剧',
    enName: 'CHOREO STORYTELLER',
    no: 'NO. 01',
    mark: 'STAGE',
    core: '表达',
    headline: '有些话说不出口，就让一个停顿替你说。',
    voice: '你盯的从来不是动作堆得满不满，而是这一拍为什么必须出现在这里。别人跳完一首歌，你跳完的是一句还没说出口的话。',
    superpower: '你能把情绪翻译成身体。一个转身、一次垂眼，观众讲不出为什么，但会安静下来。',
    shadow: '你太想「讲清楚」，有时候会忘了先跳爽。作品没成形之前，你比谁都容易怀疑自己。',
    traits: ['编舞', '成片', '舞台', '表达'],
    need: '成片课、作品打磨、舞台向课程，会比纯炸场更对你的胃口。'
  },
  wildfire: {
    name: '野火玩家',
    enName: 'WILDFIRE FREESTYLER',
    no: 'NO. 02',
    mark: 'FIRE',
    core: '爆发',
    headline: '圈刚空出来，你的身体已经先点了头。',
    voice: '你享受没有标准答案的那一秒。不一定要赢，但你很少愿意只站在外面看。',
    superpower: '你有一种练不出来的东西——上场不需要理由。场子冷的时候，第一个下去的往往是你。',
    shadow: '你的下限全靠状态。状态差的那天，你比谁都清楚自己在硬撑。',
    traits: ['Freestyle', '爆发', '即兴', '上场欲'],
    need: '即兴局、Battle 体验、Freestyle 练习，适合找敢一起进圈的人。'
  },
  tactician: {
    name: 'Battle 棋手',
    enName: 'BATTLE TACTICIAN',
    no: 'NO. 03',
    mark: 'BATTLE',
    core: '对抗',
    headline: '你上场，从来不是去碰运气。',
    voice: '收和放对你来说都是选择。真正上瘾的，是下一轮你已经知道可以怎么拆。',
    superpower: '你能在三十秒里读完一个人：他的习惯、他的空档、他怕什么。然后你把它用出来。',
    shadow: '你太会算，偶尔会忘记跳舞本来可以不讲道理。赢了却不爽的场，你也遇过。',
    traits: ['Battle', '策略', '复盘', '胜负脑'],
    need: '赛事、对抗训练、一轮一轮的复盘，比漫无目的的派对更喂得饱你。'
  },
  resonance: {
    name: '递火者',
    enName: 'RESONANCE IGNITER',
    no: 'NO. 04',
    mark: 'CYPHER',
    core: '连接',
    headline: '一个人练得再顺，也换不来被接住的那一下。',
    voice: '你要的不是陪练，是有人接住你的东西，你再把火递回去。',
    superpower: '你在的场子不会冷。你有本事把一个尴尬的圈，跳成一群人的夜晚。',
    shadow: '你太依赖「有人在」。没人接的时候，你的火灭得比想象中快。',
    traits: ['一起练舞', '接歌', '熟人局', '互相激发'],
    need: '熟人练舞局、小型 Cypher、找搭子，会比一个人死磕更让你亮起来。'
  },
  nomad: {
    name: '游牧者',
    enName: 'NIGHT PARTY NOMAD',
    no: 'NO. 05',
    mark: 'NIGHT',
    core: '自由',
    headline: '灯一暗，陌生的房间也会变成你的。',
    voice: '你追的不是热闹本身，是人和音乐撞在一起之后，突然可以自由的那一阵。',
    superpower: '你能在任何陌生场子里迅速找到自己的位置，五分钟以后已经在跟人对上眼神。',
    shadow: '你怕重复。同一间房、同一批人、同一套流程，你会先于所有人厌倦。',
    traits: ['Party', 'Club', '社交舞感', '现场'],
    need: '派对、夜场、House / Waacking / Afro 这类把房间推起来的局。'
  },
  lone: {
    name: '独行者',
    enName: 'SOLO ORBIT DANCER',
    no: 'NO. 06',
    mark: 'SOLO',
    core: '独处',
    headline: '耳机一戴，世界就刚好够用了。',
    voice: '你不是不合群，是有些东西必须一个人消化完，才会真正变成你的。',
    superpower: '你有极高的自我完成度。没人看、没人夸，你也能把一件事练到底。',
    shadow: '你太会自己待着，久到有时候忘了跳舞也可以是件热闹的事。',
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
    superpower: '你的身体自带节拍器。哪怕只是走路，你的重心也在歌里。',
    shadow: '你对炫技有点洁癖，会下意识看不上那些很难但不好听的东西。',
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
    voice: '重量、肩膀、眼神的角度——你收藏细节，像在收藏以后会变成自己的那点味道。',
    superpower: '你的眼睛比大多数人细。你能说出一支舞「好在哪」，而不只是「好」。',
    shadow: '收藏得太多，有时会不知道哪个才是自己。你的味道正在长，但你比谁都急。',
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
    voice: '这个老师的律动很特别就去，那个老师的脚法很干净也去。心动过的东西，你相信最后都会留下。',
    superpower: '你没有门派包袱。别人还在纠结「我到底是跳什么的」，你已经从三个舞种里各拿走了一块。',
    shadow: '走得太杂，偶尔会心虚：什么都会一点，什么都不算深。',
    traits: ['上课', 'Workshop', '跨舞种', '探索'],
    need: '舞室测评、大师课、体验课、拼团——你需要不断换教室，带走新的一块。'
  },
  watcher: {
    name: '观舞学者',
    enName: 'SILENT OBSERVER',
    no: 'NO. 10',
    mark: 'WATCH',
    core: '观察',
    headline: '你不一定站在圈中间，但你看得比谁都认真。',
    voice: '你看的不是热闹和输赢，是这个动作从哪来、为什么会长成这样。看，也是一种靠近。',
    superpower: '你是圈里少数说得清「为什么」的人。很多人跳得比你久，但讲不过你。',
    shadow: '你把「看懂」当成了参与。有些东西不下场，就永远不会真的懂。',
    traits: ['观赛', '文化', '审美', '观察'],
    need: '赛事解说、文化长文、观赛活动。你可以先看懂一场，再决定什么时候上场。'
  },
  crewsoul: {
    name: '齐舞团魂',
    enName: 'CREW SOUL',
    no: 'NO. 11',
    mark: 'CREW',
    core: '同频',
    headline: '十个人跳成一个人，那一下比什么都上头。',
    voice: '你享受的不是自己发光，是排练到某一遍，所有人的呼吸终于对齐。整齐这件事，对你来说是浪漫的。',
    superpower: '你能把一群人的节奏拧成一股。别人排练是完成任务，你排练是在造一个共同体。',
    shadow: '队一散，你会比谁都难受。你的成就感有很大一部分挂在别人身上。',
    traits: ['齐舞', '排练', '团队', '同步'],
    need: '齐舞作品、团队排练、团体赛；比起一个人的即兴，你更需要一支愿意一起磨的队。'
  },
  digger: {
    name: '挖歌人',
    enName: 'CRATE DIGGER',
    no: 'NO. 12',
    mark: 'CRATE',
    core: '挖掘',
    headline: '舞还没跳，歌单已经比别人厚了。',
    voice: '你收歌比收动作还认真。一首没人用过的歌被你翻出来的那一刻，比跳好一段还爽。',
    superpower: '你知道音乐从哪来。别人跟着歌跳，你能讲出这首歌为什么会长成这样。',
    shadow: '歌越存越多，练的时间越来越少。你的收藏夹，比你的身体诚实。',
    traits: ['挖歌', '歌单', 'Old School', '考据'],
    need: '音乐文化内容、Old School 专题、选曲向活动；也适合找愿意跟你换歌单的人。'
  },
  rewinder: {
    name: '回放解剖师',
    enName: 'FRAME BY FRAME',
    no: 'NO. 13',
    mark: 'REPLAY',
    core: '苛求',
    headline: '那条视频你看了三十遍，全是在看自己哪里不对。',
    voice: '别人拍完就发，你拍完先倒回去。0.5 倍速、逐帧、反复——你在找那个只有自己看得见的瑕疵。',
    superpower: '你的进步是可验证的。你能准确说出这个月比上个月好在哪，因为你手里有证据。',
    shadow: '镜子和回放会骗你。它们只会放大问题，不会告诉你你已经很好了。',
    traits: ['回放', '镜子', '细节', '自我修正'],
    need: '成片复盘、动作拆解课、有录像反馈的训练；偶尔也需要有人替你按下暂停键。'
  },
  edgewalker: {
    name: '圈外人',
    enName: 'EDGE WALKER',
    no: 'NO. 14',
    mark: 'EDGE',
    core: '蓄势',
    headline: '你的脚已经在动了，只是人还没迈进去。',
    voice: '圈围起来的时候，你的心跳先上场了。你不是不想跳，你只是在等一个「现在可以了」的瞬间。',
    superpower: '你有很多老手已经弄丢的东西——真的在乎。你还会紧张，说明这件事对你还很重要。',
    shadow: '你在等的那个「准备好了」，其实永远不会先到。它只会在你下场之后，才追上你。',
    traits: ['蓄势', '圈外', '心跳', '还没上'],
    need: '低压力的新人局、小圈子练舞、体验课。你缺的从来不是能力，是第一次。'
  },
  patcher: {
    name: '护膝战士',
    enName: 'TAPED WARRIOR',
    no: 'NO. 15',
    mark: 'TAPE',
    core: '韧性',
    headline: '你包里的护具，比换洗的衣服还多。',
    voice: '你身上有几处旧伤，天气一变它们就会提醒你。可音乐一响，你还是会站起来。',
    superpower: '你比谁都懂自己的身体。你知道今天能到几分，也知道什么时候必须停。',
    shadow: '你嘴上说悠着点，做起来常常还是过头。真正难的不是练，是承认今天不行。',
    traits: ['旧伤', '康复', '热身', '还在跳'],
    need: '康复与体能内容、低强度练舞时段、热身与保护知识；搭子最好节奏能跟你对上。'
  },
  midnight: {
    name: '厨房即兴犯',
    enName: 'KITCHEN IMPROVISER',
    no: 'NO. 16',
    mark: 'LOOSE',
    core: '失控',
    headline: '等水开的那三分钟，你已经跳完一段了。',
    voice: '你不需要舞房。地铁口、便利店、洗手间的镜子前——只要那一段响起来，身体先于脑子做了决定。',
    superpower: '你和音乐之间几乎没有延迟。别人要热身十分钟才进状态，你只需要一句副歌。',
    shadow: '你随时能跳，也随时会停。你的问题从来不是没热情，是很少坐下来把一件事练完。',
    traits: ['随时随地', '本能', '失控', '副歌就走'],
    need: '碎片化练习内容、短课、Freestyle；你需要的不是激情，是一点点结构。'
  },
  hoarder: {
    name: '囤课仓鼠',
    enName: 'CLASS HOARDER',
    no: 'NO. 17',
    mark: 'STASH',
    core: '收藏',
    headline: '课报了六节，练了两节，但快乐是真的。',
    voice: '看到好老师的课，你的手比脑子快。报名那一刻的踏实感，有时候比上课本身还香。',
    superpower: '你永远在场。这个圈子里的新老师、新课程、新工作坊，你比任何人都先知道。',
    shadow: '你囤的是「可能性」，不是能力。真正让人变强的，是回去练的那几个小时。',
    traits: ['报课', '收藏', 'Workshop', '手比脑快'],
    need: '拼团、体验课、系列课；比起再报一节，你更需要把上过的那节练透。'
  },
  socialweaver: {
    name: '舞圈社交家',
    enName: 'SOCIAL WEAVER',
    no: 'NO. 18',
    mark: 'SOCIAL',
    core: '连接',
    headline: '换一个新场子，就是换一批还没认识的人。',
    voice: '你跳舞的理由很简单：这是少数能让陌生人快速破冰的地方。你记得住人，也愿意被记住。',
    superpower: '你能在任何场子里迅速混熟。一场下来，别人记住了几支舞，你记住了五个微信。',
    shadow: '你怕一个人待着。场子越热闹你越亮，但散场之后的空，你比谁都先感觉到。',
    traits: ['社交', '破冰', '换场子', '加微信'],
    need: '新人局、跨舞室联动、派对——能认识新面孔的地方，都适合你。'
  }
}
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

/**
 * kind 用于结果文案定位，不依赖题目下标：
 * music = 音乐 DNA 唯一来源；origin = 初心；fear / keep = 结尾因果句的两端。
 */
const QUESTIONS = [
  {
    kind: 'music',
    title: '最近耳机里循环最多的，是哪一挂？',
    options: [
      opt('a', 'Funk / Boom bap，鼓点一响身体先醒', { groove: 2, wildfire: 1, midnight: 1 }, ['Funk', 'Boom bap'], ['Groove'], ['即兴局'], ['Player'], '音乐上你认 Funk、Boom bap——鼓点一起来，你先问身体醒了没有。'),
      opt('b', 'R&B / Soul，旋律先开口，情绪跟着走', { storyteller: 2, stylekeeper: 1, rewinder: 1 }, ['R&B', 'Soul'], ['Line'], ['成片'], ['Creator'], '音乐上你认 R&B、Soul——旋律先开口，你会把一首歌听成一段故事。'),
      opt('c', 'House / Afro，bass 一上来房间就被推开', { nomad: 2, resonance: 1, socialweaver: 1 }, ['House', 'Afro'], ['Flow'], ['Party'], ['Connector'], '音乐上你认 House、Afro——你先感觉房间被 bass 推开了没有。'),
      opt('d', 'Breaks / Battle Beat，专挑能点着场子的那截', { wildfire: 1, tactician: 2, watcher: 1 }, ['Breaks', 'Battle Beat'], ['Power'], ['Battle'], ['Player'], '音乐上你认 Breaks、Battle Beat——你要的是能把场子点燃的那一截。'),
      opt('e', 'K-pop / 编舞向流行，一听就想到走位', { crewsoul: 2, storyteller: 1, hoarder: 1 }, ['K-pop', 'Pop'], ['Line'], ['齐舞'], ['Creator'], '音乐上你认编舞向的流行——一听前奏，你脑子里已经在排队形了。'),
      opt('f', '没人用过的老歌，从各种角落翻出来的', { digger: 3, groove: 1, watcher: 1 }, ['Rare Groove', 'Old School'], ['Groove'], ['挖歌'], ['Digger'], '音乐上你走的是冷门路线——别人挑歌，你是在挖歌。')
    ]
  },
  {
    kind: 'origin',
    title: '说实话，你最开始为什么想跳舞？',
    options: [
      opt('a', '认识有意思的人，扩圈子', { socialweaver: 3, nomad: 1, resonance: 1 }, [], ['Flow'], ['Party'], ['Connector'], '你最开始跳舞，就是冲着能认识人去的。换个新场子，就是换一批还没加上的微信。'),
      opt('b', '音乐让我上瘾，身体忍不住', { groove: 2, midnight: 1 }, [], ['Groove'], ['独练'], ['Player'], '你最开始跳舞，是因为音乐响起来的时候身体会先于脑子做决定。'),
      opt('c', '想表达点东西，说不出口的那种', { storyteller: 2, stylekeeper: 1 }, [], ['Line'], ['成片'], ['Creator'], '你最开始跳舞，是因为有些话说不出口，但可以放进一个停顿里。'),
      opt('d', '对抗的快感，赢一轮的感觉很爽', { wildfire: 2, tactician: 1 }, [], ['Power'], ['Battle'], ['Player'], '你最开始跳舞，就是冲着那种一轮下来、目光都在你身上的感觉去的。'),
      opt('e', '想变强/变好看，身体是自己的', { lone: 2, patcher: 1 }, [], ['Control'], ['独练'], ['Student'], '你最开始跳舞，是想让身体变成你想要的样子——这是你能掌控的事。'),
      opt('f', '看到别人跳得帅，也想试试', { watcher: 2, wanderer: 1, hoarder: 2, rewinder: 1 }, [], ['Observe'], ['课堂'], ['Student'], '你最开始跳舞，是因为看到别人跳得很帅，然后想知道自己能不能也做到。'),
      opt('g', '朋友/队友拉我来的，然后留下了', { resonance: 2, crewsoul: 1 }, [], ['Freestyle'], ['朋友练舞'], ['Connector'], '你最开始跳舞，是因为有人拉你。然后你发现，有人一起的时候，这件事才真正有意思。')
    ]
  },
  {
    title: '你偷偷幻想过的高光时刻是哪个？',
    options: [
      opt('a', 'Battle 里一轮把场子点燃', { wildfire: 2, tactician: 1 }, [], ['Power'], ['Battle'], ['Player'], '你幻想过的高光，是 Battle 里一轮把场子点燃。'),
      opt('b', '成片里一个眼神，刚好压在拍上', { storyteller: 2, stylekeeper: 1 }, [], ['Texture'], ['成片'], ['Creator'], '你要的高光很安静：成片里一个眼神，刚好压在拍上。'),
      opt('c', '派对上所有人掉进同一个 groove', { nomad: 2, resonance: 1, socialweaver: 1 }, [], ['Groove'], ['Party'], ['Connector'], '你觉得最动人的，是派对上所有人一起掉进同一个 groove。'),
      opt('d', '一个人练到某个东西突然通了', { lone: 2, groove: 1 }, [], ['Control'], ['独练'], ['Student'], '你真正会记得的，是一个人练到某个东西突然通了的那个夜里。'),
      opt('e', '一队人整齐到像一个人', { crewsoul: 2 }, [], ['Sync'], ['齐舞'], ['Crew'], '你幻想的高光里有很多人：一队人整齐到像一个人。'),
      opt('f', '终于敢站进圈里，跳完一整轮', { edgewalker: 3, wildfire: 1 }, [], ['Freestyle'], ['即兴局'], ['Student'], '你想要的高光，别人可能觉得很小：终于敢站进圈里，跳完一整轮。'),
      opt('g', '在台下把一场好比赛看透，比自己跳还满足', { watcher: 3, tactician: 1 }, [], ['Observe'], ['观赛'], ['Observer'], '你的高光时刻在台下：把一场好比赛看透，比自己跳完还满足。')
    ]
  },
  {
    title: '歌一响、圈一围——你在里面通常怎么进？',
    options: [
      opt('a', '场子一起来，我第一个进圈', { wildfire: 2, tactician: 2 }, [], ['Power'], ['Battle'], ['Player'], '在练舞局和 Cypher 里，你是那种场子一起来就第一个进圈的人。'),
      opt('b', '我会盯着前一个人的点，进圈就接上', { resonance: 2, groove: 1, socialweaver: 1 }, [], ['Freestyle'], ['Cypher'], ['Connector'], '你进圈很少是单独开一段：你会盯着前一个人的点，进去就接上，再把火递回去。'),
      opt('c', '我先在旁边消化一会儿，等身体热起来', { lone: 2, groove: 1 }, [], ['Control'], ['独练'], ['Student'], '圈围起来时，你会先在旁边消化一会儿，等身体热起来再进入自己的节奏。'),
      opt('d', '我会站在圈边，把高手的东西拆开看', { watcher: 3, wanderer: 1, tactician: 1 }, [], ['Observe'], ['观赛'], ['Observer'], '你站在圈边也能很兴奋：看到高手炸场，你想的是把它拆开看。'),
      opt('e', '我会先找镜头/找光位，进圈也要好看', { storyteller: 2, stylekeeper: 2, rewinder: 1 }, [], ['Line'], ['成片'], ['Creator'], '你会先找镜头和光位：进圈不只是跳完，还要跳得好看、能留下。'),
      opt('f', '我更像“拆解员”，先看大家在练什么套路', { wanderer: 2, tactician: 1, watcher: 1 }, [], ['Foundation'], ['课堂'], ['Student'], '你更像拆解员：先看大家在练什么套路、哪段卡住，再决定从哪里切进去。'),
      opt('g', '心跳很快，脚在动，人还在圈外', { edgewalker: 3, lone: 1 }, [], ['Freestyle'], ['即兴局'], ['Student'], '圈围起来那一刻，你的心跳先上场了，人还站在圈外。'),
      opt('h', '我会先跟人打个招呼，顺手把人拽进圈', { socialweaver: 3, resonance: 1, nomad: 1 }, [], ['Flow'], ['Party'], ['Connector'], '你在圈里很少只跳自己的：你会先跟人打招呼，再顺手把人拽进圈，场子热起来你最爽。'),
      opt('i', '我会先热身两轮，能跳再进，不能就当观众', { patcher: 3, watcher: 1, lone: 1 }, [], ['Recovery'], ['观赛'], ['Observer'], '你不会硬冲：先热身两轮，能跳再进；不行就当观众，留着身体明天继续。')
    ]
  },
  {
    title: '上课的时候，你大概是这幅样子',
    options: [
      opt('a', '站前排抠细节，越拆越兴奋', { wanderer: 2, groove: 1 }, [], ['Foundation'], ['课堂'], ['Student'], '上课你站前排，拆得越细越兴奋。'),
      opt('b', '站后排也行，先在脑子里过一遍', { lone: 2, tactician: 1 }, [], ['Control'], ['独练'], ['Student'], '你宁可先站后排，让动作在脑子里过一遍，再交给身体。'),
      opt('c', '下课追着老师问：这个到底怎么练', { wanderer: 2, stylekeeper: 1 }, [], ['Texture'], ['课堂'], ['Student'], '一下课你就会追问：这个到底怎么练？你要的是能带走的方法。'),
      opt('d', '看别人卡住，会顺手补两句', { groove: 1, stylekeeper: 1, wanderer: 1 }, [], ['Foundation'], ['课堂'], ['Teacher'], '你会看见别人卡住，顺手补两句。教和学，在你这儿经常叠在一起。'),
      opt('e', '一边跳一边盯镜子里的自己', { rewinder: 3, stylekeeper: 1 }, [], ['Control'], ['回放'], ['Creator'], '你一边跳一边盯着镜子里的自己，找那个只有你看得见的地方。'),
      opt('f', '这是这个月第四节课，但好像没什么长进', { hoarder: 4 }, [], ['Foundation'], ['课堂'], ['Student'], '这已经是这个月第四节课了——报名的手，一直比练舞的腿快。')
    ]
  },
  {
    title: '看别人跳，哪一下会让你「卧槽」？',
    options: [
      opt('a', '一招出来，全场哇', { wildfire: 2, tactician: 1 }, [], ['Power'], ['Battle'], ['Player'], '最让你「卧槽」的，是一招出来全场哇的那种。'),
      opt('b', '线条、质感、表情刚刚好', { stylekeeper: 2, storyteller: 1 }, [], ['Line'], ['舞台'], ['Creator'], '线条、质感、表情刚刚好，比难度更能打中你。'),
      opt('c', '动作没几个，但人整个在歌里', { groove: 2, nomad: 1 }, [], ['Groove'], ['即兴局'], ['Player'], '动作没几个也没关系，你看的是人有没有在歌里。'),
      opt('d', '大家一起跳，场子突然就活了', { resonance: 2, socialweaver: 1 }, [], ['Flow'], ['朋友练舞'], ['Connector'], '大家一起跳、场子突然活了，比个人高光更让你动容。'),
      opt('e', '十个人齐到像一个人', { crewsoul: 2 }, [], ['Sync'], ['齐舞'], ['Crew'], '十个人齐到像一个人——那种整齐，对你来说是浪漫。'),
      opt('f', '他放的这首歌，我找了半年', { digger: 3, watcher: 1 }, [], ['Groove'], ['挖歌'], ['Digger'], '让你「卧槽」的常常不是动作，是他放的那首你找了半年的歌。'),
      opt('g', '有人在等车的时候突然自己动起来', { midnight: 3, groove: 1 }, [], ['Freestyle'], ['随时随地'], ['Player'], '你会被那种忍不住的瞬间击中——等车的人突然自己动起来。')
    ]
  },
  {
    title: '说白了，你跳舞的时候在跟音乐干嘛？',
    options: [
      opt('a', '我想赢过它，把这轮拿下来', { tactician: 2, wildfire: 1 }, [], ['Power'], ['Battle'], ['Player'], '你和音乐的关系像一场对局：你想赢过这一轮。'),
      opt('b', '我想替它把话讲出来', { storyteller: 2, stylekeeper: 1 }, [], ['Line'], ['成片'], ['Creator'], '你想替音乐把话讲出来，它是你的台词。'),
      opt('c', '我想住进去，让它带着我走', { groove: 1, lone: 1 }, [], ['Groove'], ['独练'], ['Student'], '你更想住进音乐里，让它带着你走。'),
      opt('d', '我想把旁边的人也拽进来', { nomad: 2, resonance: 1 }, [], ['Flow'], ['Party'], ['Crew'], '你想把旁边的人也拽进歌里，让整间房一起动。'),
      opt('e', '我想先拆开，看它是怎么长的', { digger: 2, watcher: 1 }, [], ['Observe'], ['挖歌'], ['Digger'], '你会先把音乐拆开，看它到底是怎么长成这样的。'),
      opt('f', '我压根没想，人已经在动了', { midnight: 4 }, [], ['Freestyle'], ['随时随地'], ['Player'], '你根本没在想——副歌一来，人已经在动了。')
    ]
  },
  {
    kind: 'fear',
    title: '别人怎么说你，你会偷偷难受很久？',
    options: [
      opt('a', '「你没什么音乐性」', { groove: 2, lone: 1 }, [], ['Groove'], ['课堂'], ['Player'], '你最怕被说没音乐性。'),
      opt('b', '「你跳得没味儿」', { stylekeeper: 2, storyteller: 1 }, [], ['Texture'], ['舞台'], ['Creator'], '你最怕被说跳得没味儿。'),
      opt('c', '「你就是不敢上」', { edgewalker: 2, wildfire: 1 }, [], ['Power'], ['Battle'], ['Player'], '你最怕被说就是不敢上。'),
      opt('d', '「你接不住别人，也带不起气氛」', { resonance: 2, nomad: 1 }, [], ['Freestyle'], ['Cypher'], ['Connector'], '你最怕自己接不住别人，也带不起气氛。'),
      opt('e', '「你老拖队伍后腿」', { crewsoul: 2 }, [], ['Sync'], ['齐舞'], ['Crew'], '你最怕拖队伍的后腿。'),
      opt('f', '「你是不是跳不动了」', { patcher: 3 }, [], ['Recovery'], ['独练'], ['Observer'], '你最怕听到那句「你是不是跳不动了」。')
    ]
  },
  {
    kind: 'keep',
    title: '最后，只能留下一样东西。',
    options: [
      opt('a', '一首能循环到天亮的歌', { lone: 2, groove: 2 }, [], ['Groove'], ['独练'], ['Student'], '到最后你愿意留下的，是一首能循环到天亮的歌。'),
      opt('b', '一群能接住你的人（你也接得住他们）', { resonance: 3 }, [], ['Freestyle'], ['朋友练舞'], ['Connector'], '到最后你愿意留下的，是一群能接住你的人——你也接得住他们。'),
      opt('c', '一个让你上场的机会', { wildfire: 2, tactician: 2 }, [], ['Power'], ['Battle'], ['Player'], '到最后你愿意留下的，是一个能让你上场的机会。'),
      opt('d', '一段终于被拍出来的作品', { storyteller: 2, stylekeeper: 2 }, [], ['Line'], ['成片'], ['Creator'], '到最后你愿意留下的，是一段终于被拍出来的作品。'),
      opt('e', '一支永远不散的队', { crewsoul: 2 }, [], ['Sync'], ['齐舞'], ['Crew'], '到最后你愿意留下的，是一支永远不散的队。'),
      opt('f', '一副不会再疼的膝盖', { patcher: 4 }, [], ['Recovery'], ['独练'], ['Observer'], '到最后你愿意留下的，是一副不会再疼的膝盖。'),
      opt('g', '一面永远不骗你的镜子', { rewinder: 4 }, [], ['Control'], ['回放'], ['Creator'], '到最后你愿意留下的，是一面永远不骗你的镜子。'),
      opt('h', '一张能上遍所有老师课的通票', { wanderer: 5 }, [], ['Foundation'], ['课堂'], ['Student'], '到最后你愿意留下的，是一张能上遍所有老师课的通票。')
    ]
  }
]

/** Q8 与 Q9 语义对齐表：命中才用「所以」串成因果句 */
const FEAR_KEEP_PAIRS = {
  a: 'a',
  b: 'd',
  c: 'c',
  d: 'b',
  e: 'e',
  f: 'f'
}

/** 常在战场 → 推荐入口话术 */
const SCENE_RECOMMEND = {
  '成片': '成片和作品打磨',
  '朋友练舞': '熟人练舞局和找搭子',
  '即兴局': '即兴局和 Freestyle',
  'Battle': '赛事与对抗训练',
  'Party': '派对和现场',
  '独练': '安静练舞时段',
  '课堂': '大师课和系统课',
  'Cypher': '小型 Cypher',
  '观赛': '观赛和文化内容',
  '舞台': '舞台向课程',
  '齐舞': '齐舞作品和团队排练',
  '挖歌': '音乐文化内容和选曲专题',
  '回放': '成片复盘和动作拆解',
  '随时随地': '碎片化练习和短课'
}

module.exports = {
  PERSONAS: PERSONAS,
  QUESTIONS: QUESTIONS,
  FEAR_KEEP_PAIRS: FEAR_KEEP_PAIRS,
  SCENE_RECOMMEND: SCENE_RECOMMEND
}
