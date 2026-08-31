# 舞岛 · 街舞内容资讯 + 活动平台（非社区版 MMVP）

依据《舞岛MMVP-PRD-非社区版 v0.2》与《舞岛MMVP-界面设计-非社区版》开发。
定位：**年轻街舞人的内容资讯工具 + 官方活动平台**——内容纯浏览（无 UGC/无社交互动），活动聚合展示 + 关注订阅提醒。

> 形态背景：个人主体资质下不可做 UGC 社区（PRD §1.1），产品定位从「社区」转向「资讯工具 + 活动平台」。

## 快速开始

1. 微信开发者工具 → 导入本目录（`兴趣社区/`）
2. 编译即预览（种子数据自动灌入 storage）

## 信息架构（3 Tab · 9 页）

| Tab | 页面 | 能力 |
|---|---|---|
| 首页 | index / post-detail / search | 6 类内容流（穿搭/康复/文化历史/赛事动态/大师课预告/舞室介绍）；分类色标签+封面；**编辑型长内容详情**（H3/H4 章节/引用块/阅读时长/相关推荐）；搜索（仅 PGC 内容，历史+热门词） |
| 活动 | activities / activity-detail | 分类筛选（全部/官方活动/赛事/大师课/Jam）；**列表/地图双视图**（原生 map + 类型分色 pin + 气泡标签 + 底部浮卡）；活动详情（彩色 hero/信息卡/日程时间轴/注意事项/**关注订阅提醒**） |
| 我的 | profile / history / my-activities / settings | 浏览历史（本地 ≤100，可清空）；关注的活动（取消关注）；设置（城市切换/活动提醒开关/协议） |

## 核心特性

- **登录可选**（PRD 4.1）：游客完整可用；静默 wx.login 无授权弹窗，拒绝不阻塞
- **编辑型长内容**：轻量 Markdown（`## H3` / `### H4` / `> 引用 + —— 出处` / `![图]`），`utils/md.js` 解析为 blocks 渲染；阅读时长按 500 字/分钟估算
- **活动关注**：mock 版订阅授权；上线接 `wx.requestSubscribeMessage`（赛前 3 天/1 天推送）
- **隐私合规**：无 UGC/无评论/无联系方式收集；位置仅用于地图定位与城市筛选
- **Adapter 数据层**：`utils/config.js` 一行切换 local（storage mock）/ http（REST 后端）

## 目录结构

```
├── app.js / app.json / app.wxss       # 3 tab 9 页
├── pages/
│   ├── index/          # tab1 内容流（发现/城市分段 + 搜索入口）
│   ├── activities/     # tab2 活动（列表/地图双视图）
│   ├── profile/        # tab3 我的（登录可选 + cells）
│   ├── post-detail/    # 编辑型长内容详情（Markdown 渲染 + 相关推荐）
│   ├── activity-detail/# 活动 hero + 日程时间轴 + 关注
│   ├── history/        # 浏览历史
│   ├── my-activities/  # 关注的活动
│   ├── search/         # 搜索（仅 PGC）
│   └── settings/       # 设置
├── utils/
│   ├── config.js       # local/http 模式开关
│   ├── api.js          # 接口层薄壳（Adapter 路由 + 搜索历史）
│   ├── adapters/local.js  # storage mock（非社区版）
│   ├── adapters/http.js   # REST 实现（401 单飞刷新）
│   ├── data.js         # 常量（6 内容类/4 活动型）+ 种子（45 帖 + 6 活动）
│   ├── md.js           # 轻量 Markdown 解析器
│   └── util.js
├── assets/icons/       # 26 个 SVG 源（自包含）
├── styles/icons.wxss   # 生成产物：43 图标类
├── images/             # tab 图标 + 地图 pin（3 色）+ mock 图片
├── tools_build_assets.py    # 资产构建（SVG→PNG/WXSS）
├── tools_export_seeds.js    # 种子导出（data.js → server/seeds-data.json）
├── server/             # 后端服务（Express + JSON/Mongo，见 server/README）
├── docs/               # 产品/导入模板（非小程序运行时）
└── agents/             # 内容生产 Agent（与小程序分离，上传包已 ignore）
```

微信上传：`project.config.json` → `packOptions.ignore` 已排除 `agents/`、`docs/`、`server/` 等，避免把 Agent/文档打进小程序包。


## 种子数据

- 45 篇 PGC 内容：穿搭 10 / 康复 10 / 文化历史 13（含长文《嘻哈从哪来》）/ 赛事动态 6 / 大师课 3 / 舞室 3 + 置顶欢迎帖
- 6 个活动：KOD 预选（赛事）/ Kilo 大师课 / 望京 Cypher Jam / HHI 北京站 / Breaking 工作坊 / 官方新人 Cypher
- 8 个运营账号、6 个热门搜索词

## Mock 内容模版

- 内容帖：`docs/帖子mock模版.md`（分类/标题/正文支持 Markdown 行格式/城市/媒体/置顶）
- 活动：`docs/活动mock模版.md`（类型/标题/地点坐标/日程时间轴/注意事项）

## 后端切换与 PGC 后台

**三步体验「编辑即发布」闭环**：

```bash
cd server && node app.js                    # ① 启动后端（零依赖 JSON 存储）
# ② 浏览器打开 http://127.0.0.1:3100/admin/（口令 wudao-admin-dev，见 server/.env）
#    编辑内容（Call-out/Blockquote 实时预览）→ 点「发布」
# ③ utils/config.js 改 mode:'http' → 开发者工具编译 → 小程序即时显示新内容
```

PGC 后台能力（`server/admin/`）：数据看板 / 内容列表（筛选·置顶·删除）/ **内容编辑器**（工具栏插入 H3·H4·加粗·Call-out·Blockquote + 右栏实时预览，渲染引擎与小程序同源）/ 发布设置（草稿·发布·置顶·标签·封面 URL·署名）/ 活动管理（类型渐变预览·日程行编辑器·坐标）。
内容与活动存储于 `server/data/store.json`（首次启动自动从种子导入）；生产部署改 `server/.env` 口令与密钥。
