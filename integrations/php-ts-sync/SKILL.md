---
name: php-ts-sync
description: 每轮更新 GemFlow 相关仓库的 origin/main，再把 PHP 后端的新增行为同步到 TS 后端；共用前端只用于核对接口。
---

# PHP → TS 后端同步

PHP 和 TS 后端共用同一个 GemFlow 前端。目标是让 TS 后端兼容同一前端的现有请求、响应和业务行为。只修改 TS 后端的实现、测试和确有需要的后端契约。

## 仓库与修改边界

| 仓库 | 用途 | 本任务的业务修改权限 |
|---|---|---|
| `/Users/louis/projects/GenFlow/nexora-genflow-service` | PHP 行为依据 | 只读 |
| `/Users/louis/projects/GenFlow/GemFlow-Services` | TS 后端实现 | 可修改后端实现和测试 |
| `/Users/louis/projects/GenFlow/GemFlow` | 两条后端共用的前端 | 只读；不修改页面、路由、菜单、文案或前端契约 |
| `/Users/louis/projects/GenFlow/GemFlow-AI` | 关联仓库 | 仅按用户要求更新代码，不做业务修改 |

用户于 2026-11-16 指定：三个业务仓库都从 `origin/main` 更新；GemFlow-AI 沿用 `origin/main`。保留当前本地分支，只允许快进。更新远端代码与自行改前端业务是两件不同的事。

技能目录：`/Users/louis/projects/GenFlow/.claude/skills/php-ts-sync`。`last-sync.json` 是已验证的同步游标；`prepare-result.json` 是本轮更新检查记录。

先读 `/Users/louis/projects/GenFlow/SOURCE_MAP.md`，分清远端 main 来源、原有本地定制与待复核同步改动。分类保存提交不等于业务验收。

## 1. 先更新全部代码

直接运行固定入口，不套 Python、Shell 或引号嵌套：

```bash
node /Users/louis/projects/GenFlow/.claude/skills/php-ts-sync/sync-tools.mjs prepare
```

入口先对四个仓库执行 `fetch --prune origin`，再统一检查工作区、分支关系，并用已获取的 `origin/main` 提交号做快进更新。只有状态为 `ready` 才进入业务同步。

存在未提交/未跟踪改动、冲突、分叉、缺少 main 或访问失败时，保留现场，报告具体仓库和阻塞。不得自动 stash、reset、切分支、创建合并提交或提交用户代码。部分仓库已经快进后其他仓库失败，要如实报告，不回滚已完成的安全更新。

## 2. 冻结同步范围

读取 `prepare-result.json` 的 `sourceCommit` 和 `last-sync.json` 的 `lastCommit`。分析 `lastCommit..sourceCommit` 的 PHP 增量，以获取到的 origin/main 为准，不把本地功能分支的未发布提交混入来源。如果旧游标不是 sourceCommit 的祖先，报告游标/分支不一致，先请求确认，不重置游标。

没有新提交时说明无需同步并结束。使用 Read、Grep、Glob 和简单直接的 Git 只读命令查看代码，不使用 Python 启动 Shell 来包装命令。

## 3. 分类与移植

每项 PHP 改动都要登记：

- 后端行为：API、数据模型、校验、过滤/排序、报表口径等，在 TS 后端实现同样的行为。
- 共用前端改动：记为“共用前端已覆盖，无需另行移植”。核对其接口依赖；差异应由 TS 后端兼容，不以修改前端掩盖后端不兼容。
- PHP 内部重构且不改变行为、独立 AI 功能等：注明不移植的证据。
- 连续修正同一功能：以本轮来源提交的最终行为为准。

查找 TS 落点时按函数、字段、接口路径和业务关键词搜索，不只找同名文件。确实没有对应后端能力时，给出搜索证据并请求确认，不自行创建另一套前端。

改一项，验证一项。可委托独立的后端子任务；每个子任务必须带相同的修改范围。不得委派前端修补任务。已有其他任务的修改不归自己所有，保留，不回滚。

涉及金额/成本/结算/舍入/分配/记账语义、权限/角色/数据隔离边界、Prisma 迁移/回填/历史数据解释时，保留原有人工确认要求。提问用 Autoloop 的 ask 回执，结束本轮等待回答，不占着进程等待用户。

## 4. 命令与资料访问

- 读文件用 Read，搜索用 Grep/Glob；修改用 Edit/Write。需要脚本时写为可检查的独立文件，使用正常权限流程执行。
- 使用固定检查入口：

```bash
node /Users/louis/projects/GenFlow/.claude/skills/php-ts-sync/sync-tools.mjs verify
```

- 该入口只在 TS 后端运行现有 `pnpm run verify`，保留真实退出码。权限允许项仅匹配这两个固定入口。
- 遇到权限拒绝，记录工具、目标和原因。不得改用 Python→Shell、编码或其它工具绕过同一拒绝。本轮无法取得必要权限时用 ask 说明最小范围。
- 重试资料优先读本轮 context 和已授权的上一批次 scratch。其它目录不默认获准；资料缺失不能用猜测填补。
- `/tmp` 中的旧测试脚本不是稳定依赖。先从仓库中查找现有对照测试入口；不存在就报告缺失或在已授权的 TS 后端测试目录内实现测试。
- 用子任务进度消息确认状态；不要反复启动 9 分钟睡眠脚本等待标记文件。等待不是完成证据。

## 5. 验证与完成

完成需要：本轮 PHP 增量逐项分类；应移植的后端行为已实现；现有 verify 通过；每项变化至少有一个 PHP/TS 同输入对照场景；共用前端无本任务新增修改。

从当前仓库查找契约检查入口。旧手册的 `scripts/check-contracts.mjs` 在核查时不存在，不能虚报通过，也不能为通过检查而改前端。使用当前已有的契约测试；必要验证缺失时明确标为未验收。

结束前用执行前后的状态与文件差异核对修改范围。不能把已有的前端脏文件自动算为本轮修改，也不能以恢复现场为由丢弃用户改动。子任务若报告改了前端，列出文件并请求审查，不继续扩大修改。

只有已完成全部验证的连续 PHP 提交范围才能推进 `last-sync.json`。未验收项保留待办，游标不越过它们。结论包含：来源提交范围、四个仓库的更新结果、PHP 改动→TS 后端位置→验证证据表、阻塞与剩余事项。报告写入本轮 scratch，第一行给清楚结论。

## 保留的边界

不打印密码、Token、Cookie 或连接串；不自动 git commit/push；不改 PHP 业务代码、共用前端或 GemFlow-AI 业务代码；不改已有 `database/postgresql/checksums.json` 哈希条目。
