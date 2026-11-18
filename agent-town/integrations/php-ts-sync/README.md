# PHP→TS 同步修正（2026-11-16）

用户确认三个业务仓库每轮从 origin/main 更新；共用 GemFlow 前端不另行移植。GemFlow-AI 原本跟踪 origin/main，一并获取/快进，业务代码只读。

已部署文件：GenFlow/.claude/skills/php-ts-sync/SKILL.md、sync-tools.mjs。GenFlow/.claude/settings.local.json 只追加 prepare/verify 两条精确命令许可，原有设置保留。实时 rules.json 的 PHP线同步TS线 已追加范围指令并通过 check/save/readback。正在执行的 142-2 保留已领取的旧 Job，没有重启、取消、切分支或回滚。

三次拒绝的实际原因：
1. Read 访问 142-1/scratch/NOTES.md，而本轮启动只授权 142-2。claude-retry-scratch.patch 仅增加同一 run 的先前 attempt/scratch，不开放其他任务或整个 home，排除链接。重启后的新 Claude 启动生效。
2. Bash 的 python3 -c 多行引号内含换行注释，触发命令参数校验。
3. Bash 的 Python→Shell 嵌套中包含 $transaction/$queryRaw 等表达式，触发无法预检查变量的保护。

保留 acceptEdits。没有设置 bypassPermissions，也没有关闭校验。手册改用原生文件工具、简单直接命令和固定执行入口；权限失败必须报告，不能通过包装命令绕过。此修正不承诺所有任意 Shell 命令免审批。

prepare 先获取全部四个 origin，统一检查，再按固定 SHA 快进当前分支。脏工作区、分叉、缺少 main 或获取失败会阻塞整轮业务同步。远端获取不会修改正在用的工作区；本次未对业务仓库实际执行 prepare/pull，因为用户要求保持当前任务。

测试：checks/php-ts-sync.test.mjs 验证全部 fetch 先于合入、固定 main 目标和脏工作区/分叉无 merge；checks/claude-retry-scratch.mjs 验证同轮重试目录、其他轮次排除、符号链接排除和权限模式保留。

安装重试补丁：在 ~/.agent-autoloop/app 运行 git apply --check <patch>，再应用；更新可能覆盖本地补丁。运行中的任务不热改会话，新规则约束从后续领取/重试时采用。已有前端改动归属要根据执行日志与历史差异核对，不自动回滚。
