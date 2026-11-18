# GenFlow 同步的来源与本地定制

2026-11-16 整理后，三个业务仓库继续使用 feat/multi-tenant 工作分支。更新方向是 origin/main → 工作分支；不修改 main，不推送。

- GemFlow：同一份前端供 PHP/TS 后端使用，origin 为 GitLab nexora/gemflow。原有 58 个本地改动文件保存在 1c3d84d。142-1 曾额外改写 BatchStockDialog.tsx 和其测试，已核对写入前后内容并撤下；随后从 origin/main 获取主分支的正式版本。本任务不另改前端。
- nexora-genflow-service：PHP 行为来源，origin 为 GitLab nexora/gemflow-services。100 个此前已有的本地文件改动保存在 2137220。主要包含多租户/商户隔离与本地对照环境。业务同步的新增来源以 origin/main 的固定提交范围为准，不把本地定制误当作上游新增。
- GemFlow-Services：TS 后端，origin 为 GitHub Restry/GemFlow-Services；GitHub API 显示 fork=false，仓库 README 说明其保留原单体仓库历史后拆分。224 个既有/较早文件保存在 02c86ca；12 个有本轮新文件证据的文件在 a6b96e1；26 个混合或归属尚不完整的文件在 5107cd4。保存提交不是功能验收，不删除其中的多租户隔离。
- GemFlow-AI：共享 AI 服务，origin 为 GitHub Restry/GemFlow-AI，fork=false；本次工作区原本干净，不做业务改写。

证据边界：08:10 的状态快照只证明文件当时已脏，不证明其全部当前内容都未变；TS/PHP 旧快照有前 80 项截断，较早文件时间只作辅助证据。完整逐文件清单和逐次工具写入记录保存在 ~/.agent-autoloop/audits/20261116-sync-cleanup/。不会把整个混合文件伪称为某次 Agent 独占产物。

今后每次同步先获取各仓库 origin/main，保留工作分支的本地定制。只对确认的 PHP 上游业务增量更新 TS 后端；契约必须兼容共用前端，前端的代码更新来自其 origin/main。不得 reset 到 main 丢弃本地提交；不得把工作分支合回 main 或推送，除非用户另行要求。

当前范围只整理 Git 与本地代码。未执行数据库迁移、部署或生产操作；带有原有数据库测试跳过的检查不能当成数据库验收。
