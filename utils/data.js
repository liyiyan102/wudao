/**
 * 舞岛 MMVP（非社区版）· 常量体系 + Mock 种子数据
 *
 * 产品形态：内容资讯（6 类 PGC 纯浏览）+ 官方活动平台 + 个人中心（浏览历史/关注活动）
 * 无 UGC / 无社交互动 / 无消息（个人主体资质约束，PRD v0.2 §1.1）
 *
 * 内容帖 body 支持轻量 Markdown 行格式（详情页渲染，PRD 4.3）：
 *   "## 标题"   → H3 章节
 *   "### 标题"  → H4 小节
 *   "- 条目"    → 无编号列表
 *   "1. 条目"   → 数字编号列表
 *   "> 文字"    → 引用块（红色左线 + 浅灰底）
 *   "> —— 出处" → 引用块的来源行
 *   "![说明]"   → 图片位
 *   其余行      → 段落
 */
const { dayOffset } = require('./util')

/* ================= 常量 ================= */

/** 内容分类（穿搭/康复/文化/舞室/新鲜事） */
const CONTENT_CATS = {
  outfit:  { name: '穿搭',   tagCls: '',    coverCls: 'p' },
  recovery:{ name: '康复',   tagCls: 'c2',  coverCls: 'g' },
  culture: { name: '文化',   tagCls: 'c4',  coverCls: 'b' },
  studio:  { name: '舞室',   tagCls: '',    coverCls: 'p' },
  fresh:   { name: '新鲜事', tagCls: 'c6',  coverCls: 'c' }
}

/** 活动类型：找搭子 / 官方活动 / 赛事 / 大师课 / 其他 */
const ACTIVITY_TYPES = {
  buddy:    { name: '找搭子',   grad: 'linear-gradient(135deg, #534AB7 0%, #3C3489 100%)', color: '#534AB7' },
  official: { name: '官方活动', grad: 'linear-gradient(135deg, #534AB7 0%, #3C3489 100%)', color: '#534AB7' },
  contest:  { name: '赛事',     grad: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)', color: '#1565C0' },
  master:   { name: '大师课',   grad: 'linear-gradient(135deg, #FF6B35 0%, #C62828 100%)', color: '#FF6B35' },
  other:    { name: '其他',     grad: 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)', color: '#607D8B' }
}

/** 练舞局子类型（代发撮合） */
const BUDDY_SUBTYPES = {
  practice: { name: '练舞',   badge: '找搭子 · 练舞',   color: '#534AB7', grad: 'linear-gradient(135deg, #534AB7 0%, #3C3489 100%)' },
  group:    { name: '团购',   badge: '找搭子 · 团购',   color: '#FF6B35', grad: 'linear-gradient(135deg, #FF6B35 0%, #C62828 100%)' },
  teammate: { name: '找队友', badge: '找搭子 · 找队友', color: '#2E7D32', grad: 'linear-gradient(135deg, #07C160 0%, #2E7D32 100%)' },
  other:    { name: '其他',   badge: '找搭子 · 其他',   color: '#3C3489', grad: 'linear-gradient(135deg, #7B61FF 0%, #534AB7 100%)' }
}

const BUDDY_REQUEST_STATUS = {
  pending:   { name: '审核中', color: '#E65100' },
  rejected:  { name: '已驳回', color: '#FA5151' },
  published: { name: '已发布', color: '#07C160' },
  closed:    { name: '已结束', color: '#8A8A8E' }
}

const BUDDY_DEFAULT_NOTES = '加入后你的联系方式将发给发起人，由发起人主动联系你。舞岛不参与线下交易与担保。请勿单独赴约未成年人。'

/** 活动分类筛选 chips（全部 / 找搭子 / 赛事 / 大师课 / 其他） */
const ACTIVITY_FILTERS = [
  { key: '',         name: '全部' },
  { key: 'official', name: '官方活动' },
  { key: 'buddy',    name: '找搭子' },
  { key: 'contest',  name: '赛事' },
  { key: 'master',   name: '大师课' },
  { key: 'other',    name: '其他' }
]

const CITIES = require('./cities').CITIES

/**
 * 首页顶部分类 tab（discover=全部 / city=城市 / 其余按内容类聚合）
 * 新鲜事 = 新鲜事 + 舞室
 */
const FEED_TABS = [
  { key: 'discover', name: '发现', cats: null },
  { key: 'city', name: '', cats: null }, // 动态显示当前城市
  { key: 'culture', name: '文化', cats: ['culture'] },
  { key: 'fresh', name: '新鲜事', cats: ['fresh', 'studio'] },
  { key: 'outfit', name: '穿搭', cats: ['outfit'] }
]

/** 热门搜索（运营配置，PRD 4.8：仅 PGC 内容） */
const HOT_SEARCHES = [
  { word: 'KOD 世界总决赛', tag: '热' },
  { word: '嘻哈从哪来', tag: '新' },
  { word: 'Breaking 入门', tag: '' },
  { word: '护腕选择', tag: '' },
  { word: '大师课预告', tag: '' },
  { word: '舞室探店', tag: '' }
]

/* ================= 种子数据 ================= */

function seedUsers() {
  return [
    // PGC 内容账号（前置内容由运营后台以这些账号发布）
    { id: 'u_official', nickname: '舞岛官方', city: '北京', column: 'official', columnName: '平台官方', avatar: '/uploads/avatar_official.jpg' },
    { id: 'u_culture', nickname: '岛上旧事', city: '北京', column: 'culture', columnName: '文化', avatar: '/uploads/avatar_culture.jpg' },
    { id: 'u_outfit', nickname: '上场衣橱', city: '上海', column: 'outfit', columnName: '穿搭', avatar: '/uploads/avatar_outfit.jpg' },
    { id: 'u_contest', nickname: '赛程来了', city: '北京', column: 'contest', columnName: '赛事', avatar: '/uploads/avatar_contest.jpg' },
    { id: 'u_gossip', nickname: '岛上风闻', city: '上海', column: 'gossip', columnName: '圈内八卦', avatar: '/uploads/avatar_gossip.jpg' },
    { id: 'u_recovery', nickname: '筋骨笔记', city: '上海', column: 'recovery', columnName: '运动康复', avatar: '/uploads/avatar_recovery.jpg' },
    { id: 'u_teacher_jay', nickname: 'Jay 老师说舞', city: '北京', column: 'master', columnName: '老师说舞', avatar: '/uploads/avatar_teacher_jay.jpg' },
    { id: 'u_kilo', nickname: 'Kilo 老师说街舞', city: '北京', column: 'master', columnName: '老师说舞', avatar: '/uploads/avatar_kilo.jpg' },
    { id: 'u_beibei', nickname: '康复师小贝', city: '北京', column: 'recovery', columnName: '康复', avatar: '/uploads/avatar_beibei.jpg' }
  ]
}

function seedContents() {
  return [
/* ---- 运动康复 × 5 ---- */
    {
      id: 'p_rec1', kind: 'content', cat: 'recovery', title: '高强度训练后的膝盖康复清单', body: 'Breaking 和 Popping 对膝关节的剪切负荷被严重低估。\n\n训练后 48 小时是黄金恢复窗口：冰敷 15 分钟、股四头肌筋膜放松、靠墙静蹲 3 组。\n\n如果出现弹响伴随疼痛，请立即停训就医，不要相信"练开了就好了"。', images: [], video: '', publisherId: 'u_recovery', city: '上海', createdAt: dayOffset(-1, 10), pinned: false
    },
    {
      id: 'p_rec2', kind: 'content', cat: 'recovery', title: '手腕疼别硬练！Powermove 前的护腕选择指南', body: '倒立类动作对手腕的压力 = 体重 × 1.5 倍以上。\n\n护腕选加压绑带式还是套筒式？本文按动作类型给你对照表。\n\n另外：练前腕关节激活 5 分钟，比任何护具都重要。', images: [], video: '', publisherId: 'u_recovery', city: '上海', createdAt: dayOffset(-3, 9), pinned: false
    },
    {
      id: 'p_rec3', kind: 'content', cat: 'recovery', title: '舞者的睡眠修复：练到凌晨真的会变菜', body: '肌肉的超量恢复发生在深度睡眠期。\n\n连续一周睡眠 < 6 小时，动作学习效率下降 30%，受伤风险翻倍。\n\n夜练党看完这篇，把训练时间往前挪两小时试试。', images: [], video: '', publisherId: 'u_recovery', city: '北京', createdAt: dayOffset(-5, 20), pinned: false
    },
    {
      id: 'p_rec4', kind: 'content', cat: 'recovery', title: '脚踝扭伤 RICE 原则，Cypher 前必看', body: ' landing 落地不稳是脚踝扭伤的头号原因。\n\nRest 冰敷加压抬高，四步走。48 小时内千万别热敷、别揉。\n\n恢复期可以做弹力带抗阻训练，逐步找回本体感觉。', images: [], video: '', publisherId: 'u_recovery', city: '上海', createdAt: dayOffset(-8, 11), pinned: false
    },
    {
      id: 'p_rec5', kind: 'content', cat: 'recovery', title: '久坐办公的 Hip-hop 律动僵硬？三招打开髋关节', body: '白天坐 8 小时，晚上跳舞 hip 就是"锁死"的。\n\n90/90 拉伸、弓步转体、深蹲保持，每天 10 分钟。\n\n律动的源头在髋，不在肩。练两周，up-down 立刻顺滑。', images: [], video: '', publisherId: 'u_recovery', city: '北京', createdAt: dayOffset(-10, 8), pinned: false
    },
    {
      id: 'p_rec6', kind: 'content', cat: 'recovery', title: '踝关节稳定性训练：跳出"落地不稳"的怪圈', body: '很多 dancer 的脚踝是"能动的果冻"。\n\n单腿站立 30 秒 × 3 组（闭眼加难）、弹力带内外翻抗阻、提踵慢放。\n\n四周之后，你会发现 landing 和 freeze 的底气完全不一样。', images: [], video: '', publisherId: 'u_recovery', city: '上海', createdAt: dayOffset(-11, 10), pinned: false
    },
    {
      id: 'p_rec7', kind: 'content', cat: 'recovery', title: '肩关节灵活度不够，你的 freeze 永远差一口气', body: '倒立撑不住不一定是力量问题，多半是肩屈活动度不足。\n\n靠墙滑肩、弹力带绕肩、胸椎旋转，三个动作每天 8 分钟。\n\n练前热身做这些，比直接硬上安全十倍。', images: [], video: '', publisherId: 'u_recovery', city: '北京', createdAt: dayOffset(-13, 9), pinned: false
    },
    {
      id: 'p_rec8', kind: 'content', cat: 'recovery', title: '舞者腰椎保护指南：腰不是用来甩的', body: 'Hip-hop 的 body roll、Breaking 的桥，都极依赖腰椎灵活性。\n\n但灵活 ≠ 无控制。核心稳定训练（死虫式、鸟狗式）应占训练量的 20%。\n\n腰突没有回头路，预防成本永远低于治疗。', images: [], video: '', publisherId: 'u_recovery', city: '上海', createdAt: dayOffset(-15, 15), pinned: false
    },
    {
      id: 'p_rec9', kind: 'content', cat: 'recovery', title: '休息日怎么安排才不算偷懒？', body: '练三休一是街舞圈的黄金节律。\n\n休息日做三件事：筋膜放松 20 分钟、轻量拉伸、把本周练的动作视频回看一遍。\n\n大脑会在休息中完成动作记忆的巩固——这叫离线学习。', images: [], video: '', publisherId: 'u_recovery', city: '北京', createdAt: dayOffset(-17, 11), pinned: false
    },
    {
      id: 'p_rec10', kind: 'content', cat: 'recovery', title: '一张自查表：这五种疼必须立刻停', body: '1. 关节弹响伴随疼痛\n2. 某个动作角度的尖锐刺痛\n3. 练后超过 48 小时不退的胀痛\n4. 夜间静息痛\n5. 局部肿胀发热\n\n出现任何一条，停训就医。别用"再练练就开了"安慰自己。', images: [], video: '', publisherId: 'u_recovery', city: '上海', createdAt: dayOffset(-19, 8), pinned: false
    },
/* ---- 街舞文化 × 5 ---- */
    {
      id: 'p_cul1', kind: 'content', cat: 'culture', title: 'Breaking 从街头到奥运的 50 年', body: '1973 年，Kool Herc 在布朗克斯把 break 节奏拉长，Bboy 就此诞生。\n\n90 年代 Battle 文化成型，2010 后赛事全球化，直到站上奥运领奖台。\n\n但文化的根始终在 Cypher 里：那个圆圈代表的平等与即兴，才是 Breaking 的灵魂。', images: [], video: '', publisherId: 'u_culture', city: '北京', createdAt: dayOffset(0, 9), pinned: false
    },
    {
      id: 'p_cul2', kind: 'content', cat: 'culture', title: 'Funk 是什么？Locking 舞者必须听懂的音乐史', body: '没有 Funk 就没有 Locking。\n\n从 James Brown 到 The Jimmy Castor Bunch，Lock 的每个 point 都踩在 Horn 段落上。\n\n歌单已整理好，先听 100 遍再谈味道。', images: [], video: '', publisherId: 'u_culture', city: '北京', createdAt: dayOffset(-2, 15), pinned: false
    },
    {
      id: 'p_cul3', kind: 'content', cat: 'culture', title: 'Waacking 的前世：地下俱乐部的手臂美学', body: '70 年代洛杉矶，Waacking 诞生于黑人及拉丁裔 LGBTQ 群体的地下派对。\n\n它对 Disco 时代的张扬表达，是勇气，也是反抗。\n\n今天我们甩动手臂时，致敬的是那群在压力下依然起舞的人。', images: [], video: '', publisherId: 'u_culture', city: '上海', createdAt: dayOffset(-4, 18), pinned: false
    },
    {
      id: 'p_cul4', kind: 'content', cat: 'culture', title: 'Old School vs New Style：吵了 20 年的世纪之争', body: '一方说根基不能丢，一方说表达要进化。\n\n其实历史反复证明：所有 New Style 最终都会变成未来的 Old School。\n\n与其站队，不如两个都练。', images: [], video: '', publisherId: 'u_culture', city: '北京', createdAt: dayOffset(-7, 12), pinned: false
    },
    {
      id: 'p_cul5', kind: 'content', cat: 'culture', title: 'Krump 为什么看起来在"生气"？', body: 'Krump 诞生于 2000 年代初的洛杉矶南部，是对街区暴力的出口。\n\n它的高强度不是攻击性，是把无处安放的情绪打进舞蹈里。\n\n看懂这一点，你才能看懂 Tight Eyez 的每一场 Battle。', images: [], video: '', publisherId: 'u_culture', city: '上海', createdAt: dayOffset(-9, 16), pinned: false
    },
    {
      id: 'p_cul6', kind: 'content', cat: 'culture', title: 'House 舞蹈简史：仓库派对里长出来的自由', body: '80 年代芝加哥和纽约的仓库派对，DJ 把 Disco 搓成连续的 4/4 拍。\n\nHouse 的脚步_FAST、jacking、lofting——全都长在这种"永不停歇"的节奏上。\n\n今天你在舞房练的每一个 step，都是那个时代留给我们的遗产。', images: [], video: '', publisherId: 'u_culture', city: '北京', createdAt: dayOffset(-11, 14), pinned: false
    },
    {
      id: 'p_cul7', kind: 'content', cat: 'culture', title: 'Popping 与"机器人"：一场对机械美学的致敬', body: 'Popping 的灵感之一来自 60 年代街头艺人的机器人模仿秀（Robot）。\n\n肌肉的瞬间收缩（pop）+ 停顿的错觉（dime stop），制造"提线木偶"的观感。\n\n它是 Funk 时代的技术流：用人体模拟机械，再反过来嘲笑机械。', images: [], video: '', publisherId: 'u_culture', city: '北京', createdAt: dayOffset(-13, 10), pinned: false
    },
    {
      id: 'p_cul8', kind: 'content', cat: 'culture', title: 'Cypher 解码：为什么街舞要围成一个圈', body: 'Cypher 不是"轮流solo"，而是一场没有裁判的对话。\n\n圈的能量来自每个人的注视与回应：你上一个人的动作，我可以接住并抛回去。\n\n理解了这一点，你就不会在 Cypher 里抢拍、背对舞者、或者刷完手机就走。', images: [], video: '', publisherId: 'u_culture', city: '上海', createdAt: dayOffset(-15, 19), pinned: false
    },
    {
      id: 'p_cul9', kind: 'content', cat: 'culture', title: '东瀛图谱：日本街舞为什么这么强', body: '从 80 年代 Soul Train 传入，到 Zulu Nation 日本分部成立，再到 OTORO 世代统治国际赛场。\n\n日本的秘密武器是"稽古"文化：同一个基础步，愿意抠三年。\n\n体系化的教学 + 极致的细节偏执 = 让欧美都忌惮的深度。', images: [], video: '', publisherId: 'u_culture', city: '北京', createdAt: dayOffset(-17, 15), pinned: false
    },
    {
      id: 'p_cul10', kind: 'content', cat: 'culture', title: '街舞黑话词典：从"炸场"到"说唱脸"', body: '炸场：把气氛顶到最高点的表演。\n松：动作拖泥带水不干净。\n压拍：完全踩死节拍的精准。\n说唱脸：battle 里挑衅但不失礼貌的表情管理。\n\n学会这些词，你才算拿到了圈子的入场券。', images: [], video: '', publisherId: 'u_culture', city: '上海', createdAt: dayOffset(-19, 13), pinned: false
    },
    {
      id: 'p_cul11', kind: 'content', cat: 'culture', title: '于喧嚣之中，读懂街头的真话', body: '提起嘻哈，很多人的第一印象是说唱、潮流、张扬的歌词。但它从来不等同于某一类音乐，它是一套完整的街头文化，是底层普通人记录现实、诉说生存的叙事方式。这本书跳出流量与商业滤镜，以对话的形式，把嘻哈的起源、内核与演变娓娓道来，打破了我以往许多刻板的偏见。\n\n嘻哈诞生于纽约布朗克斯破败的街区，没有精致的舞台，没有专业的资源。DJ、MC、霹雳舞、涂鸦四大元素，最初只是街区青年的自我表达出口。物质匮乏的环境里，年轻人用唱盘拼接节奏，用说唱讲述自己真实的生活，用舞蹈释放情绪，在墙壁留下属于自己的印记。它的底色不是炫富与反叛的姿态，而是普通人对生活的记录，如同现代的街头民谣，把失业、困境、挣扎直白写进歌词里。\n\n随着风靡全球，嘻哈被商业市场重新包装。豪车、奢侈品成为大众对嘻哈最固化的标签，很多人只看见浮华的外壳，却遗忘它源自底层的精神内核。书中让我印象很深的一个观点：嘻哈是 "当下的纪实"，它记录的就是所处时代真实的人与事，不必美化苦难，也不用刻意标榜愤怒。匪帮说唱那些粗粝的故事，不是刻意宣扬暴力，而是把社群真实的生存境遇直白呈现出来。真实，才是嘻哈最根本的灵魂。\n\n这本书也解开了我的的一个误区：说唱只是嘻哈的其中一环，而非全部。DJ 对唱片的再创作、b-boy 斗舞里的尊重与博弈、涂鸦在城市空间的发声，共同组成嘻哈完整的生态。它讲究创造，讲究挪用与重塑，从旧的唱片采样出新节拍，在现实生活提炼创作素材，是无权者夺回表达权的一种方式。\n\n当嘻哈传播到世界各地，它也在不断本土化改造。不是照搬欧美的腔调与话术，而是讲述自己土地上的生活。真正的嘻哈精神，不在于外在穿搭、犀利的口号，而在于敢于直面现实，忠于自我的表达。', images: ['/uploads/11.jpeg'], video: '', publisherId: 'u_culture', city: '北京', createdAt: dayOffset(0, 11), pinned: false
    },
    {
      id: 'p_cul12', kind: 'content', cat: 'culture', title: '嘻哈从哪来：1973 年那个改变了音乐的派对', subtitle: '三本书叠在一起读，拼出嘻哈从 Bronx 街头到全球化的完整图景', body: '>>t 导读\n>> 市面上讲嘻哈的中文书不少，但能称得上"必读组合"的，我推荐这三本——《别再问我什么是嘻哈》入门科普，《给年轻一代的嘻哈简史》偏历史脉络，《20 世纪最后的草根艺术》偏深度文化分析。\n>> 三本叠在一起读，恰好能拼出嘻哈从 1973 年 Bronx 街头到今天全球化文化的完整图景。\n\n## 一、嘻哈从哪来：1973 年 8 月 11 日那个派对\n\n所有讲嘻哈的书都绕不开一个日期：1973 年 8 月 11 日。\n\n那天晚上，一个叫 Kool Herc 的牙买加裔 DJ 在纽约布朗克斯区 Sedgwick Avenue 1520 号的休闲室里给妹妹 Cindy 办返校派对，门票男方 5 毛、女方 2 毛 5。他做了一件当时没人做的事：用两台唱机交替播放同一张唱片里鼓点最重、节奏最强的间奏段落（break），让跳舞的孩子能持续跳下去。这个技术后来叫"Merry-Go-Round"，break 延长了，节奏没断，孩子们跳疯了。\n\n袁越在《20 世纪最后的草根艺术》里反复强调一个观点：嘻哈不是被发明的，是被逼出来的。70 年代的 Bronx 是美国城市衰败的标本——白人中产外迁、税基崩溃、公共服务瘫痪、纵火骗保成风。公立学校砍掉了音乐课，穷人家的孩子买不起乐器，学不了正经音乐。但他们有唱机、有唱片、有从加勒比带来的"舞厅 sound system"传统。没有乐器，就把别人的音乐切碎拼起来重新拼；没有录音棚，就在街上对着人群喊话。\n\n> "嘻哈是一种用极低门槛的设备创造出来的艺术形式。它的核心不是技术先进，而是资源匮乏下的创造力爆发。"\n> —— 袁越《20 世纪最后的草根艺术》\n\n第一批 bboy / bgirl 就在这个派对上诞生——他们跳的不是今天的 breaking，是 toprock 和 footwork 的雏形，后来演化成独立的舞蹈语言。那个晚上后来被官方认定为嘻哈文化的诞生日，1520 Sedgwick Avenue 成了"圣地"。\n\n### 为什么是布朗克斯\n\n不是哈莱姆，不是布鲁克林，是布朗克斯。这个细节值得停一下。\n\n布朗克斯的特别之处在于：它同时具备了"最匮乏"和"最多年轻人"两个条件。高速公路的修建把社区拦腰斩断，废弃公寓楼一栋接一栋，但这里也是纽约最年轻的区——1970 年代，布朗克斯超过三分之一的人口不满 18 岁。\n\n一大群无所事事的年轻人 + 几乎为零的公共文化资源 = 任何能自己动手搞起来的娱乐都会被疯狂拥抱。DJ 的唱机、MC 的麦克风、bboy 的纸板箱、写手的喷漆罐，四样东西凑齐了，就是一场不需要任何人批准的派对。\n\n## 二、从派对到文化：四个元素的诞生顺序\n\n很多人以为嘻哈四大元素（DJ / MC / Breaking / 涂鸦）是同时出现的，其实有一条清晰的先后链。\n\n先是 DJ。Kool Herc 的 Merry-Go-Round 之后，Grandmaster Flash 把技术推向极致——他发明了 quick mix theory，能用手指精确到四分之一拍的位置切唱片。DJ 是引擎，没有延长了的 break，就没有后面的一切。\n\n然后是跳舞的孩子们。break 一延长，等待已久的那批人冲进圈里跳最炸的那一段——他们就是第一批 bboy。名字的由来很直接：break + boy，在 break 里跳舞的男孩。\n\nMC 起初只是 DJ 的助手，负责喊两句"把双手举起来"维持气氛。直到有人开始押韵、讲故事、互相比拼，说唱才从"暖场工具"变成主角。\n\n涂鸦最早其实和嘻哈音乐没有直接关系——它是独立生长的地铁涂鸦文化。但 70 年代末，媒体和市府把这批"用城市当画布的年轻人"和"在街头开派对的年轻人"打包报道，四种表达从此被绑定为"嘻哈文化"。\n\n> 文化史学家 Jeff Chang 在《Can’t Stop Won’t Stop》里的总结更直接：嘻哈不是一种音乐风格，而是一代人在城市废墟里发明出来的整套生活方式。\n\n## 三、全球化与本土化：为什么每个国家都有自己的嘻哈\n\n80 年代嘻哈进入主流商业视野，Run-DMC 和 Def Jam 把它变成生意；90 年代东西海岸的对峙把生意变成传奇。但在商业叙事之外，另一条线更值得注意：嘻哈在每个落脚的地方，都长出了完全不同的样子。\n\n法国的嘻哈带着北非移民的政治呐喊；日本的嘻哈发展出对 Funk 音乐近乎学术式的考究；韩国把它和偶像工业嫁接，长出了后来席卷全球的 K-pop 舞蹈版图。\n\n> 嘻哈的全球化不是复制粘贴，而是每一次落地都被当地年轻人重新发明一遍——这才是它生命力真正的来源。\n\n在中国，街舞的本土化路径同样清晰：从 90 年代录像带时代的模仿，到《这！就是街舞》把Breaking 带上电视，再到霹雳舞入亚运、入奥——竞技体育成了中国街舞最独特的一条生长线。\n\n## 四、回到当下：嘻哈精神还剩下什么\n\n写到这里，可以正面回答标题的问题了：嘻哈从哪来？\n\n从匮乏里来，从被忽视的年轻人手里来，从"没有条件也要创造条件"的劲头里来。\n\n商业化把嘻哈变成了万亿产业，但它最底层的逻辑从来没变过：用你手边仅有的东西，创造属于你的表达。一台唱机可以，一双球鞋可以，一段 8 拍的 break 也可以。\n\n所以下次站进 Cypher 的时候，可以想想 50 年前布朗克斯那间休闲室——你正在参与的，是一场持续了半个世纪、还在继续的派对。', images: [], video: '', publisherId: 'u_official', city: '北京', createdAt: dayOffset(0, 10), pinned: false
    },

/* ---- 街舞穿搭 × 5 ---- */
    {
      id: 'p_out1', kind: 'content', cat: 'outfit', title: 'Bboy 穿搭指南：宽松有度才是灵魂', body: '新手第一个误区：越宽松越好。\n\n实际上 toprock 和 footwork 需要裤腿收口，windmill 才需要极致宽松。本文按舞种拆分裤型选择。\n\n鞋底方面，power 系选手建议 split-sole 薄底，灵敏度直接决定 freeze 稳定性。', images: [], video: '', publisherId: 'u_outfit', city: '上海', createdAt: dayOffset(-1, 18), pinned: false
    },
    {
      id: 'p_out2', kind: 'content', cat: 'outfit', title: 'Waacker 的手套美学：细节里的年代感', body: '一副合适的手套能让你的 arm line 在灯光下翻倍出彩。\n\n丝绒、网纱、亮片，分别对应不同年代的 Disco 气质。\n\n重点：手套颜色要和服装形成对撞，而不是顺色。', images: [], video: '', publisherId: 'u_outfit', city: '上海', createdAt: dayOffset(-2, 11), pinned: false
    },
    {
      id: 'p_out3', kind: 'content', cat: 'outfit', title: '百元内的实战好鞋盘点（2026 版）', body: '不是所有人都能为一双鞋花掉半月生活费。\n\n帆布鞋、训练鞋、国货老牌，实测 6 款 300 元以内能打的。\n\n选鞋逻辑：先看鞋底纹路抓地力，再看侧向支撑，最后才是颜值。', images: [], video: '', publisherId: 'u_outfit', city: '北京', createdAt: dayOffset(-4, 10), pinned: false
    },
    {
      id: 'p_out4', kind: 'content', cat: 'outfit', title: '赛场造型心机：让裁判多看你一眼的三件套', body: '帽子、腰带、袜子的呼应色，是海选脱颖而出的隐藏分。\n\n但切记：造型永远服务于动作，别让宽大卫衣挡住你的层次。\n\n赛前一晚把整套穿搭拍照存档，避免当天手忙脚乱。', images: [], video: '', publisherId: 'u_outfit', city: '上海', createdAt: dayOffset(-6, 14), pinned: false
    },
    {
      id: 'p_out5', kind: 'content', cat: 'outfit', title: '冬天怎么练舞不臃肿？三层穿法教学', body: '内层排汗、中层保暖、外层防风，户外 Cypher 也能舒展开。\n\n重点保护部位：膝盖、腰、手腕。\n\n练完 10 分钟内加外套，别让汗水贴身风干。', images: [], video: '', publisherId: 'u_outfit', city: '北京', createdAt: dayOffset(-9, 9), pinned: false
    },
    {
      id: 'p_out6', kind: 'content', cat: 'outfit', title: '夏天练舞怎么穿才不闷？', body: '速干T恤 + 及膝裤 + 厚底袜，是夏训三件套。\n\n避开纯棉——吸汗后变"移动水袋"，还容易磨破皮肤。\n\n颜色选浅色系，视频回放时轮廓更清晰。', images: [], video: '', publisherId: 'u_outfit', city: '上海', createdAt: dayOffset(-11, 11), pinned: false
    },
    {
      id: 'p_out7', kind: 'content', cat: 'outfit', title: '配饰安全指南：这些东西别带上舞池', body: '长链条、大耳环、硬手环——battle 里的隐形凶器。\n\n配饰三原则：贴身、软质、无棱角。\n\n想要酷，用帽子、发带、袜子颜色来做文章，安全又出片。', images: [], video: '', publisherId: 'u_outfit', city: '北京', createdAt: dayOffset(-13, 16), pinned: false
    },
    {
      id: 'p_out8', kind: 'content', cat: 'outfit', title: '舞者发型手册：怎么甩头都不乱', body: 'Breaking 的 headspin、Hip-hop 的 headbang，对发型是极限测试。\n\n长发：高马尾 + 螺旋发绳，双保险。\n\n短发：发蜡选哑光定型，汗水 + 亮光蜡 = 油腻现场。', images: [], video: '', publisherId: 'u_outfit', city: '上海', createdAt: dayOffset(-15, 10), pinned: false
    },
    {
      id: 'p_out9', kind: 'content', cat: 'outfit', title: '女生 Breaking 装备清单：安全排第一', body: '护膝（必备）、护掌、低马尾、收脚口长裤。\n\n上衣选修身款——宽大卫衣会挡住动作层次，裁判看不见你的细节。\n\n预算有限？先买最好的护膝，其他都可以慢慢补。', images: [], video: '', publisherId: 'u_outfit', city: '北京', createdAt: dayOffset(-17, 14), pinned: false
    },
    {
      id: 'p_out10', kind: 'content', cat: 'outfit', title: '百元舞者衣橱：十个单品撑起一整年', body: '纯色速干T × 3、束脚裤 × 2、渔夫帽、白袜 × 5、复古跑鞋 × 1。\n\n全部国货平价渠道可以凑齐，总价 600 以内。\n\n穿搭的核心是"能穿去上班也能直接进舞房"，场景切换零成本。', images: [], video: '', publisherId: 'u_outfit', city: '上海', createdAt: dayOffset(-19, 9), pinned: false
    },
    /* ---- 舞室 × 3 ---- */
    {
      id: 'p_std1', kind: 'content', cat: 'studio', title: '舞室探店 | 望京 SOHO 地下的那家"镜子房"', body: 'B1 层，整面墙的落地镜，层高足够 windmill 不撞灯。\n\n工作日晚场人少，周末下午常年满员。地板是专业舞蹈地胶，powermove 党放心。\n\n储物柜免费，淋浴 10 元。月卡价格在望京属于中等偏下。', images: [], video: '', publisherId: 'u_official', city: '北京', createdAt: dayOffset(-3, 12), pinned: false
    },
    {
      id: 'p_std2', kind: 'content', cat: 'studio', title: '舞室收录 | 上海 Castan Dance Lab：House 舞者的家', body: '藏在静安一条弄堂里的老牌舞室，House 圈子的"据点"。\n\n周四晚的 House 固定课坚持了 6 年，老师换了三任，课没停过。\n\n木地板 + 老音响，氛围值直接拉满。', images: [], video: '', publisherId: 'u_official', city: '上海', createdAt: dayOffset(-7, 14), pinned: false
    },
    {
      id: 'p_std3', kind: 'content', cat: 'studio', title: '选舞室的 5 个硬指标（避坑指南）', body: '1. 地胶还是水泥地——膝盖会诚实地告诉你答案。\n2. 层高——freeze 和 powermove 的生死线。\n3. 镜子面积——能看到全身 + 侧面最好。\n4. 音响——低频下潜不够的馆，律动教学打对折。\n5. 晚高峰人流——太挤的场地，一支舞跳一半就撞人。', images: [], video: '', publisherId: 'u_official', city: '北京', createdAt: dayOffset(-12, 10), pinned: false
    },
    /* ---- 置顶运营位 ---- */
    {
      id: 'p_pin1', kind: 'content', cat: 'culture', title: '欢迎来到舞岛：街舞人的内容资讯 + 活动平台', body: '在这里你可以：\n\n1. 刷穿搭、康复、文化、赛事等 6 类街舞内容\n2. 查看全国街舞赛事、大师课、Jam 活动\n3. 关注活动，开赛前收到提醒\n\n内容每日更新，活动持续收录中。', images: [], video: '', publisherId: 'u_official', city: '北京', createdAt: dayOffset(-15, 10), pinned: true
    }
  ]
}

/* ================= 官方活动种子（PRD 4.4：活动由运营 PGC 维护） ================= */

function seedActivities() {
  return [
    {
      id: 'a1', type: 'contest', title: 'KOD 世界总决赛中国区预选', shortTitle: 'KOD 预选',
      desc: '中国街舞最高级别赛事海选，Breaking / Hip-hop / Locking / Popping 四舞种同台竞技，优胜者获得 KOD 世界赛参赛资格。',
      city: '北京', location: '北京 工人体育馆', lat: 39.9319, lng: 116.4473,
      dateText: '8月24日', timeText: '14:00 - 22:00', danceTypes: 'Breaking · Hip-hop · Locking · Popping',
      organizer: 'KOD 中国区组委会', followCount: 1248,
      schedule: [
        { time: '14:00', item: '签到入场' },
        { time: '15:00', item: 'Breaking 1v1 海选' },
        { time: '17:00', item: 'Hip-hop 1v1 海选' },
        { time: '19:00', item: 'Locking · Popping 2v2 海选' },
        { time: '21:00', item: '决赛 · 颁奖' }
      ],
      notes: '参赛选手需提前 1 小时到场签到；观赛免预约，14:00 入场；场馆内禁止闪光灯；详细规则见活动官方公众号。'
    },
    {
      id: 'a2', type: 'master', title: 'Kilo 大师课 · Hip-hop 律动专修', shortTitle: 'Kilo 大师课',
      desc: '舞界 Kilo 老师亲授，从 isolation 到律动节奏，4 课时拆解 Hip-hop 的核心律动。',
      city: '北京', location: '北京 望京 SOHO', lat: 39.9957, lng: 116.4818,
      dateText: '9月2日', timeText: '14:00 开场 · 4 课时', danceTypes: 'Hip-hop',
      organizer: 'Kilo Studio', followCount: 156,
      schedule: [
        { time: '14:00', item: 'isolation 基础拆解' },
        { time: '15:30', item: '律动节奏与音乐切分' },
        { time: '17:00', item: '组合编排实战' },
        { time: '18:30', item: '分组展示 · 点评' }
      ],
      notes: '适合练舞 1 年以上的 dancer；请穿软底运动鞋；课间提供饮用水。'
    },
    {
      id: 'a3', type: 'other', title: '望京 Cypher Night · 周六 Jam', shortTitle: 'Cypher Night',
      desc: '每周六晚 8 点，望京 SOHO B1 圆形舞台，自由报名，自由组合，dancers 围圈共舞。',
      city: '北京', location: '望京 SOHO B1', lat: 39.9962, lng: 116.4810,
      dateText: '每周六', timeText: '20:00 - 22:00', danceTypes: '全舞种',
      organizer: '望京舞友会', followCount: 342,
      schedule: [
        { time: '20:00', item: '开场 · 热身 Cypher' },
        { time: '20:30', item: '自由斗舞环节' },
        { time: '21:30', item: '新人 showcase' }
      ],
      notes: '免费参与，无需报名；自带饮用水；雨雪天气自动取消（以当日社群通知为准）。'
    },
    {
      id: 'a4', type: 'contest', title: 'HHI 世界街舞锦标赛北京站', shortTitle: 'HHI 北京站',
      desc: 'Hip Hop International 中国区北京分站赛，新增 Mega Crew 大齐舞组别，前 3 名晋级中国区总决赛。',
      city: '北京', location: '北京 五棵松体育馆', lat: 39.9075, lng: 116.2829,
      dateText: '9月7日', timeText: '10:00 - 21:00', danceTypes: 'Hip-hop · 齐舞',
      organizer: 'HHI 中国区组委会', followCount: 892,
      schedule: [
        { time: '10:00', item: '青少年组预赛' },
        { time: '14:00', item: '成人组齐舞预赛' },
        { time: '18:00', item: 'Mega Crew 组决赛' },
        { time: '20:30', item: '颁奖' }
      ],
      notes: '报名截止 8 月 31 日；观赛门票 80 元起；场地提供更衣室与寄存。'
    },
    {
      id: 'a5', type: 'master', title: 'Breaking 基础工作坊 · 第三期', shortTitle: 'Breaking 工作坊',
      desc: 'toprock / go-down / footwork 三大板块，小班教学 15 人，零基础友好。',
      city: '北京', location: '三里屯太古里北区', lat: 39.9363, lng: 116.4477,
      dateText: '8月30日', timeText: '15:00 开场 · 3×90 分钟', danceTypes: 'Breaking',
      organizer: 'Jay 老师说舞', followCount: 214,
      schedule: [
        { time: '15:00', item: 'toprock 基础与乐感' },
        { time: '16:30', item: 'go-down 衔接技巧' },
        { time: '18:00', item: 'footwork 框架纠正' }
      ],
      notes: '名额 15 人报满即止；穿宽松长裤与软底鞋；提供护膝借用。'
    },
    {
      id: 'a6', type: 'official', title: '舞岛官方 · 新人欢迎 Cypher', shortTitle: '新人 Cypher',
      desc: '舞岛官方活动的线下新人局：教练带练 30 分钟 + 自由 Cypher，认识同城舞友。',
      city: '北京', location: '国贸 CBD 文化广场', lat: 39.9087, lng: 116.4575,
      dateText: '9月1日', timeText: '19:00 - 21:00', danceTypes: '全舞种 · 零基础友好',
      organizer: '舞岛官方', followCount: 486, joinCount: 128, checkinCount: 96,
      schedule: [
        { time: '19:00', item: '签到 · 分组破冰' },
        { time: '19:30', item: '教练带练基础律动' },
        { time: '20:10', item: '自由 Cypher' },
        { time: '20:50', item: '合影 · 自由交流' }
      ],
      notes: '完全免费；现场有舞岛周边小礼品；家长可旁观。'
    },
    {
      id: 'a7', type: 'buddy', buddySubType: 'practice', buddyStatus: 'recruiting',
      title: '周三晚望京 Breaking 练舞局', shortTitle: '望京 Breaking',
      desc: '找同水平 Breaking 舞者一起练基本功，从 toprock 到 footwork，互相交流进步。适合练舞 1 年以上的 bboy/bgirl。',
      city: '北京', location: '望京 SOHO T3 · B1 舞蹈室', lat: 39.9957, lng: 116.4818,
      dateText: '8月27日', timeText: '19:00 - 21:00', danceTypes: 'Breaking',
      organizer: '舞岛官方', followCount: 0, headcount: '不限',
      schedule: [], notes: BUDDY_DEFAULT_NOTES
    },
    {
      id: 'a8', type: 'buddy', buddySubType: 'group', buddyStatus: 'recruiting',
      title: 'Kilo 大师课 3 人拼团', shortTitle: 'Kilo 拼团',
      desc: 'Kilo 老师 Hip-hop 律动专修大师课，3 人成团享拼单价，已有 2 人，还差 1 人。',
      city: '北京', location: '望京 SOHO', lat: 39.9957, lng: 116.4818,
      dateText: '9月2日', timeText: '14:00', danceTypes: 'Hip-hop',
      organizer: '舞岛官方', followCount: 0, headcount: '3',
      schedule: [], notes: BUDDY_DEFAULT_NOTES
    },
    {
      id: 'a9', type: 'buddy', buddySubType: 'teammate', buddyStatus: 'recruiting',
      title: 'HHI 齐舞赛差 2 人 Breaking 队员', shortTitle: 'HHI 找队友',
      desc: '队伍已有 2 人，差 2 名 Breaking 队员参加 HHI 北京站齐舞赛，要求练舞 2 年以上。',
      city: '北京', location: '北京 五道口', lat: 39.9928, lng: 116.3372,
      dateText: '9月8日', timeText: '全天', danceTypes: 'Breaking',
      organizer: '舞岛官方', followCount: 0, headcount: '2',
      schedule: [], notes: BUDDY_DEFAULT_NOTES
    }
  ]
}

function seed() {
  return {
    users: seedUsers(),
    posts: seedContents(),
    activities: seedActivities()
  }
}

module.exports = {
  CONTENT_CATS, ACTIVITY_TYPES, ACTIVITY_FILTERS, CITIES, FEED_TABS, HOT_SEARCHES,
  BUDDY_SUBTYPES, BUDDY_REQUEST_STATUS, BUDDY_DEFAULT_NOTES, seed
}
