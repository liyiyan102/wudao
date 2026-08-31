/**
 * JSON 文件存储（零依赖，本地与服务器通用）
 * - 已有 data/store.json 时：完全以后台数据为准，启动不补种子、不改写正文
 * - 仅无 store.json 时：首次从 seeds-data.json 初始化
 * - 写操作同步落盘（写临时文件再 rename，防写坏）
 * - PGC 内容免审直接 online（后台是可信源，编辑即可发布）
 */
const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, 'data')
const STORE_FILE = path.join(DATA_DIR, 'store.json')
const SEEDS_FILE = path.join(__dirname, 'seeds-data.json')

let _db = null

const CATS = {
  outfit:  { name: '穿搭',   tagCls: '',   coverCls: 'p', chip: 'chip-purple' },
  recovery:{ name: '康复',   tagCls: 'c2', coverCls: 'g', chip: 'chip-green' },
  culture: { name: '文化',   tagCls: 'c4', coverCls: 'b', chip: 'chip-blue' },
  studio:  { name: '舞室',   tagCls: '',   coverCls: 'p', chip: 'chip-gray' },
  fresh:   { name: '新鲜事', tagCls: 'c6', coverCls: 'c', chip: 'chip-cyan' }
}
const ACT_TYPES = {
  buddy:    { name: '找搭子',   grad: 'linear-gradient(135deg, #534AB7 0%, #3C3489 100%)', color: '#534AB7' },
  official: { name: '官方活动', grad: 'linear-gradient(135deg, #534AB7 0%, #3C3489 100%)', color: '#534AB7' },
  contest:  { name: '赛事',     grad: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)', color: '#1565C0' },
  master:   { name: '大师课',   grad: 'linear-gradient(135deg, #FF6B35 0%, #C62828 100%)', color: '#FF6B35' },
  other:    { name: '其他',     grad: 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)', color: '#607D8B' }
}
const BUDDY_SUBTYPES = {
  practice: { name: '练舞',   badge: '找搭子 · 练舞',   color: '#534AB7', grad: 'linear-gradient(135deg, #534AB7 0%, #3C3489 100%)' },
  group:    { name: '团购',   badge: '找搭子 · 团购',   color: '#FF6B35', grad: 'linear-gradient(135deg, #FF6B35 0%, #C62828 100%)' },
  teammate: { name: '找队友', badge: '找搭子 · 找队友', color: '#2E7D32', grad: 'linear-gradient(135deg, #07C160 0%, #2E7D32 100%)' },
  other:    { name: '其他',   badge: '找搭子 · 其他',   color: '#3C3489', grad: 'linear-gradient(135deg, #7B61FF 0%, #534AB7 100%)' }
}
const BUDDY_DEFAULT_NOTES = '加入后你的联系方式将发给发起人，由发起人主动联系你。舞岛不参与线下交易与担保。请勿单独赴约未成年人。'

/** 后台署名用的栏目账号；已有库缺号时补齐，不覆盖运营改过的昵称 */
const PGC_AUTHORS = [
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

function uid(prefix) {
  return prefix + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36)
}

function seedStats() {
  return {
    views: Math.floor(200 + Math.random() * 2000),
    completes: Math.floor(80 + Math.random() * 800),
    shares: Math.floor(5 + Math.random() * 60)
  }
}

/** 列表排序：置顶优先 → sort 升序（越小越靠前）→ 时间倒序 */
function cmpSort(a, b) {
  const pa = a.pinned ? 1 : 0
  const pb = b.pinned ? 1 : 0
  if (pb !== pa) return pb - pa
  const sa = typeof a.sort === 'number' ? a.sort : Number.MAX_SAFE_INTEGER
  const sb = typeof b.sort === 'number' ? b.sort : Number.MAX_SAFE_INTEGER
  if (sa !== sb) return sa - sb
  return (b.createdAt || 0) - (a.createdAt || 0)
}

/** 新建内容排到最前 */
function nextSort(list) {
  let min = 0
  ;(list || []).forEach(x => {
    if (typeof x.sort === 'number' && x.sort < min) min = x.sort
  })
  return min - 1
}

/** 按 ids 顺序写入 sort（0..n-1） */
function applyReorder(list, ids) {
  ;(ids || []).forEach((id, i) => {
    const item = list.find(x => x.id === id)
    if (item) item.sort = i
  })
}

const OLD_NICKNAMES = {
  u_culture: ['文化考古队'],
  u_outfit: ['穿搭研究局', '上场这身'],
  u_gossip: ['赛事速报局', '圈内八卦站', '听说了'],
  u_recovery: ['康复研究所', '先别硬撑']
}

function migrate(db) {
  let changed = false
  if (!Array.isArray(db.users)) { db.users = []; changed = true }
  PGC_AUTHORS.forEach(a => {
    const u = db.users.find(x => x.id === a.id)
    if (!u) {
      db.users.push(Object.assign({ avatar: '' }, a))
      changed = true
      return
    }
    if (!u.avatar || (a.avatar && u.avatar !== a.avatar)) {
      u.avatar = a.avatar
      changed = true
    }
    if (!u.column) {
      u.column = a.column
      u.columnName = a.columnName
      changed = true
    } else if (u.columnName !== a.columnName) {
      u.columnName = a.columnName
      changed = true
    }
    const olds = OLD_NICKNAMES[a.id]
    if (olds && olds.indexOf(u.nickname) > -1 && u.nickname !== a.nickname) {
      u.nickname = a.nickname
      changed = true
    }
  })
  if (!Array.isArray(db.buddyRequests)) { db.buddyRequests = []; changed = true }
  if (!Array.isArray(db.applications)) { db.applications = []; changed = true }
  if (!Array.isArray(db.joins)) { db.joins = []; changed = true }
  if (!Array.isArray(db.notices)) { db.notices = []; changed = true }
  if (!Array.isArray(db.feedbacks)) { db.feedbacks = []; changed = true }
  ;(db.activities || []).forEach(a => {
    if (a.pinned === undefined) { a.pinned = false; changed = true }
    // 旧类型 Jam → 其他（仅改 type 字段，不改标题/正文）
    if (a.type === 'jam') { a.type = 'other'; changed = true }
  })
  ;(db.posts || []).forEach(p => {
    if (p.noCover) { p.noCover = false; changed = true }
    if (p.cat === 'contest' || p.cat === 'master') {
      p.cat = 'fresh'
      changed = true
    }
  })
  // 仅补字段：缺 sort 时按当前置顶+时间编号（不增删内容）
  ;['posts', 'activities'].forEach(key => {
    const list = db[key] || []
    if (list.some(x => typeof x.sort !== 'number')) {
      list.slice().sort((a, b) => {
        const pa = a.pinned ? 1 : 0
        const pb = b.pinned ? 1 : 0
        if (pb !== pa) return pb - pa
        return (b.createdAt || 0) - (a.createdAt || 0)
      }).forEach((item, i) => { item.sort = i })
      changed = true
    }
  })
  return changed
}

function initStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (fs.existsSync(STORE_FILE)) {
    _db = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'))
    if (migrate(_db)) persist()
    return _db
  }
  const seeds = fs.existsSync(SEEDS_FILE)
    ? JSON.parse(fs.readFileSync(SEEDS_FILE, 'utf-8'))
    : { users: [], posts: [], activities: [], hotSearches: [] }

  _db = {
    users: seeds.users || [],
    posts: (seeds.posts || []).map(p => Object.assign({}, p, {
      status: 'published',
      tags: [],
      stats: seedStats()
    })),
    activities: (seeds.activities || []).map(a => Object.assign({}, a, { status: 'published' })),
    joins: [],
    buddyRequests: [],
    applications: [],
    notices: [],
    feedbacks: [],
    hotSearches: seeds.hotSearches || []
  }
  migrate(_db)
  persist()
  console.log('[store] 初始化完成：', _db.posts.length, '篇内容 /', _db.activities.length, '个活动')
  return _db
}

function persist() {
  const tmp = STORE_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(_db, null, 1), 'utf-8')
  fs.renameSync(tmp, STORE_FILE)
}

function getDB() {
  if (!_db) initStore()
  return _db
}

function pushNotice(db, n) {
  db.notices = db.notices || []
  db.notices.unshift({
    id: uid('n'),
    uid: n.uid,
    kind: n.kind,
    title: n.title,
    body: n.body || '',
    requestId: n.requestId || '',
    activityId: n.activityId || '',
    read: false,
    createdAt: n.createdAt || Date.now()
  })
}

module.exports = {
  getDB, persist, uid, pushNotice, CATS, ACT_TYPES, BUDDY_SUBTYPES, BUDDY_DEFAULT_NOTES, PGC_AUTHORS, seedStats,
  cmpSort, nextSort, applyReorder
}
