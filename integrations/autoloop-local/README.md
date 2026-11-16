# 官方源码与本地扩展的边界

## 当前 fork 接入（2026-11-16）

用户确认使用自己的 fork：https://github.com/Restry/agent-autoloop 。已通过 GitHub API 核实 fork=true、parent 为 KKKKhazix/agent-autoloop，当前账号 Restry 有管理和写权限。

源码目录 origin 已改为 git@github.com:Restry/agent-autoloop.git，upstream 保留官方仓库；codex/agent-town 基于 fork 的 8e96e1c 加本地扩展。安装目录 origin 同样改为用户 fork，原本的本地 origin 改名为 local-source；已部署代码保存到 deploy/agent-town-20261116，运行程序未切换版本。以下来源链是接入前记录。

## 接入前来源链

官方仓库：https://github.com/KKKKhazix/agent-autoloop

`/Users/louis/projects/agent-autoloop` 的 origin 指向官方仓库；安装副本 `~/.agent-autoloop/app` 的 origin 指向这个本地源码目录。基线提交见 BASE_COMMIT。

GitHub 上 `https://github.com/Pinned/agent-autoloop` 的确是官方仓库的 fork（parent/source 都是 KKKKhazix/agent-autoloop），但当前本机的两个 origin 均未指向该 fork。不据此声称本机安装已经接入它，也不修改远端。

Agent 小镇网页仓库位于本项目根目录，已有本地 Git 历史，当前没有 origin 远端。

## 我们的扩展

| 位置 | 归属 |
|---|---|
| 官方内核、Agent 插件、事件与通道协议 | 官方源码基线 |
| `host/ui.ts` 与 host/config/http/server 接入 | 本地规则文件检查、保存和界面 API 扩展 |
| worker 环境变量过滤修改 | 本地 Claude 配置保留修正 |
| Claude retryScratchFolders | 本地同一轮重试 scratch 目录授权修正 |
| `worker/artifacts.mjs` 与 worker 接入点 | 本地交付成果快照扩展 |
| 本项目 dist、server.mjs、integrations、checks | Agent 小镇界面、代理、项目任务与扩展测试 |

engine.patch 完整保存安装副本相对官方基线的受跟踪修改以及 host/ui.ts、worker/artifacts.mjs 新文件。已在基线源码目录执行 git apply --check 通过；本次没有实际向该干净源码目录应用补丁，没有推送官方仓库或 fork。数据库、凭据、rules.json 和报告正文均不包含在补丁中。

更新官方程序前先检查并备份；不能把本地扩展误当作官方更新而覆盖。重新应用需要相同基线或先适配新版本。
