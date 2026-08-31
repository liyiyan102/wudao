# agents · 内容生产 Agent（与小程序分离）

本目录 **不属于小程序运行时**，也不应打进微信上传包。

| 目录 | 用途 |
|------|------|
| [`dance-desk/`](./dance-desk/) | Dance Desk：街舞 PGC 内容策略与写作 Agent（设计 + Prompt） |
| [`xhs-workflow/`](./xhs-workflow/) | 小红书内容工作流 Agent Skill（[anniekoala/xhs-workflow](https://github.com/anniekoala/xhs-workflow)） |
| [`xiaohongshu-mcp/`](./xiaohongshu-mcp/) | 小红书 MCP 服务（[xpzouying/xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp)，见 [CURSOR接入.md](./xiaohongshu-mcp/CURSOR接入.md)） |

小程序 / 后台仍用仓库根目录的 `pages/`、`server/`、`docs/`（产品与导入模板）。  
Agent 产出按 [`../docs/内容导入模板.md`](../docs/内容导入模板.md) 填 Excel，再经 PGC 后台导入。

微信开发者工具上传时已在 `project.config.json` → `packOptions.ignore` 排除 `agents/**`。
