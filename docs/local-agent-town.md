# Agent 小镇本地扩展

本工作分支基于 Restry/agent-autoloop 的 main（8e96e1c），保留官方协议和内核边界。网页客户端位于独立的 agent-town 仓库，不放入本仓库。

远端约定：origin 为 git@github.com:Restry/agent-autoloop.git；upstream 为 https://github.com/KKKKhazix/agent-autoloop.git。开发分支为 codex/agent-town，不直接改 main。

本地扩展包括规则文件读取/检查/保存 API、Claude 配置环境保留、同轮重试 scratch 目录授权、按轮次保存文件成果快照。整理中还修正了 HTTP 请求头到 Headers 的类型转换及环境变量回归测试的索引类型。

2026-11-16 修正：当前 macOS 环境的原生目录监听没有发出规则文件原子替换事件，导致三项数据库锁测试等不到 tick 失败。最小复现中 fs.watch 无事件，watchFile 检测到文件 inode 变化。host/server.ts 保留原生监听，增加每秒文件状态检查，共用已有 tick/锁争用重试，关闭时取消两种监听；未放宽锁超时或修改测试预期。

验证：三项原始锁争用回归均通过（锁失败后恢复、等待期间新事件、错误规则通知）。完整快速测试使用 Node 24.18.0、4 个测试文件并发：808 项，787 通过、21 跳过、0 失败；类型检查和格式检查通过。原先并发套件里的飞书处理说明测试也通过。

部署前的运行快照保留为 ~/.agent-autoloop/app 的 deploy/agent-town-20261116（2d9b1be），用于回滚。经验证的更新推送到 origin/codex/agent-town 后再部署，服务的 health 信息标明实际运行提交；config.json、rules.json 与数据库独立保留，晚间同步计划不属于 Git 更新。

后续先在本工作分支核对官方更新并验证，再选择部署提交。不要直接将官方版本覆盖到运行目录，也不要把规则、凭据、数据库或报告正文提交到 Git。规则 API 必须显式配置 hub.ui.rulesFile: true；真实 HTTP 回归覆盖默认关闭、本人认证、转发请求拒绝、校验和保存。此分支不合入 main。
