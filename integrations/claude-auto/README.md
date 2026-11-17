# PHP→TS 同步的 Claude Auto 启动器

用户于 2026-11-17 要求停止正在执行的 181 轮，用 Auto Mode 接着原会话继续。

中台原生 access=edit 映射 acceptEdits。本扩展使用官方已有的 agent.program 接口，在独立的 claude-sync-auto 配置中替换 CLI 的 permission-mode 为 auto；其它 Agent 配置不变，继续使用原生 Claude adapter 的输出解析、用量与停止机制。不使用 bypassPermissions。

部署文件在 ~/.agent-autoloop/bin/claude-sync-auto.mjs，settings 文件在同目录。per-invocation settings 补充本任务的 GenFlow 可信目录和源仓库，避免沿用用户全局 Auto 环境中其它项目的描述；增加 push、reset --hard、clean -f 和 stash drop/clear 的拒绝项，不改全局设置。

一次性续办文件 claude-sync-auto.resume.json 保存原 session、cwd 和原 run 文件夹。启动时原子移到 resume-<新run>.json，只为这一个 run 替换 --session-id 为 --resume；该 run 重试仍用相同映射，普通后续定时任务不会自动接回旧会话。模式切换前必须确认旧进程组已退出，避免同一会话并发。

本次证据：181 已 cancelled，原进程组 6722 无活进程；182 的 system.init 明确报告 permissionMode=auto，session 与 181 相同。上下文与代码快照见私有备份目录 ~/.agent-autoloop/backups/run181-before-auto-1794880317232/。规则的定时时间未改变。

测试：checks/claude-auto.test.mjs 验证保留原生协议参数、显式续办和默认新会话。独立真实 Auto 探测用同一 MiMo 网关完成 Bash 写测试文件，日志记录一次 classifier 请求、无权限拒绝。该探测不等于业务同步完成，仍需核实实际移植与测试结果。
