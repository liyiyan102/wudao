# 舞岛后端服务（wudao-server）

Express + MongoDB 单服务，按《技术架构设计.md》v1.3 实现。与 meetpoint 共机不共库（独立 `wudao` database）。

## 模块结构

```
server/
├── app.js                # 入口：安全头 / JSON 1MB / $键清洗 / 静态媒体 / 全局错误
├── config.js             # env 读取（密钥只从环境变量来）
├── db.js                 # MongoClient 单例（database: wudao）
├── routes/
│   ├── auth.js           # 登录（code2session / dev mock）/ profile 白名单 / logout / me
│   ├── content.js        # feed / 详情 / 发帖审核流 / reactions / comments / mine·collected·liked
│   ├── buddy.js          # feed / 发帖 / apply（隐私红线）/ applies（发起人鉴权）/ end / mine
│   ├── search.js         # 统一搜索（regex 转义）/ 热词（5min 缓存）
│   ├── message.js        # 消息列表 / 未读 / 全部已读
│   ├── upload.js         # 媒体上传（multer + uploads 生命周期）
│   ├── seccheck.js       # 微信审核回调（trace_id → 状态机联动）
│   └── admin.js          # 口令登录 / PGC 发布 / 下架 / role 授予 / 举报列表
├── middleware/
│   ├── auth.js           # JWT + sessions 白名单 + 封禁拦截（authRequired / optionalAuth）
│   └── rateLimit.js      # 间隔型 + 窗口型内存限频
├── services/
│   ├── wxapi.js          # code2session / msgSecCheck / mediaCheckAsync / access_token 缓存
│   ├── audit.js          # 敏感词粗筛 → 官方接口分级调用
│   └── notify.js         # 站内消息写入
├── migrations/index.js   # 幂等：全量索引 + 空库种子（seeds-data.json）
├── jobs/cron.js          # 过期下架 / 孤儿媒体清理 / 备份 / 软删物理清理
├── seeds-data.json       # 种子（由小程序侧 tools_export_seeds.js 生成）
├── deploy.sh             # 一键部署（本地执行）
└── nginx-wudao.conf      # Nginx 增量配置
```

## 快速开始（本地开发）

```bash
cd server
cp .env.example .env       # NODE_ENV 保持 dev：无 WX_SECRET 时自动 mock 登录
npm install
npm start                  # 127.0.0.1:3100（需本地 MongoDB，wudao-dev 可用 MONGO_URI 指定）
```

## 部署到腾讯云（生产）

```bash
# 1. 部署服务（首次会自动生成 .env：随机 JWT_SECRET/ADMIN_PASSWORD，dev 模式）
cd server && chmod +x deploy.sh && ./deploy.sh

# 2. 服务器上配置 Nginx（追加两个 location，见 nginx-wudao.conf 注释）
ssh root@43.155.128.236
vim /etc/nginx/conf.d/xxx.conf   # 粘贴 nginx-wudao.conf 内容到 meetpoint server 块
nginx -t && nginx -s reload

# 3. 配置微信（mp 后台）
#    - request 合法域名加 https://meetpoint.top
#    - 开发设置里拿 AppSecret → 服务器 /opt/wudao/.env 的 WX_SECRET
#    - 消息推送 URL: https://meetpoint.top/wudao/api/seccheck/callback + Token 同 .env
#    （配好 Secret 后把 .env 的 NODE_ENV 改回 production 并 pm2 restart wudao）

# 4. 验证
curl https://meetpoint.top/wudao/                    # { ok: true, service: 'wudao-server' }
curl https://meetpoint.top/wudao/api/search/hot      # 热门词
```

## 小程序端切换真实后端

`utils/config.js`：`mode: 'local'` → `'http'`，重新编译即切换（页面零改动，Adapter 模式）。

## 运营接口速查

```bash
# 口令登录（拿 adminToken）
curl -X POST https://meetpoint.top/wudao/api/admin/login -d '{"password":"<ADMIN_PASSWORD>"}'

# 以官方账号发 PGC 帖
curl -X POST https://meetpoint.top/wudao/api/admin/pgc-publish \
  -H "Authorization: Bearer <adminToken>" \
  -d '{"accountNickname":"康复研究所","cat":"recovery","title":"...","body":"..."}'

# 下架
curl -X POST .../api/admin/remove -H "..." -d '{"targetType":"post","targetId":"..."}'
```

## 安全要点（对应架构附录 A）

- `session_key` 用完即弃不落库；contact 仅在 `/api/buddy/posts/:id/applies`（发起人校验后）输出
- profile 字段白名单：`role/status/accountType` 等越权字段丢弃并写 `admin_audit`
- applies `(userId, postId)` 唯一索引 + 业务查重双保险（E11000 → 4103）
- 搜索 regex 元字符全量转义（防 ReDoS）；请求体 `$` 前缀键递归剔除（NoSQL 注入）
- 上传 uuid 重命名 + 扩展名白名单 + temporary 24h 孤儿清理
- 密钥仅存服务器 `.env`（600 权限，不入 git）
