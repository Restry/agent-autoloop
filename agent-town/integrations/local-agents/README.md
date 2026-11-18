# 本地 Agent 接入

2026-11-15，本机 rules.json 新增 Codex、GitHub Copilot、OMP、Hermes、Pi Agent 五项执行配置。已有 Claude、巡检脚本和只读排查配置保留。规则文件修改前已备份到 ~/.agent-autoloop/rules.before-local-agents.json。

- Codex：使用内置 codex 适配器，已登录，最小调用通过。
- GitHub Copilot：本机只有 VS Code 内的组件，因此安装官方 @github/copilot 1.0.112 到 ~/.agent-autoloop/tools/copilot；使用非交互输出，未开启 allow-all/yolo。最小调用通过。
- OMP、Hermes：使用已安装 CLI 的打印模式，最小调用通过。
- Pi Agent：启动命令已登记；其现有 github-copilot 登录凭据返回 401，尚待用户登录恢复。不能据此认定 Pi 已能执行模型任务。

右侧按“所在电脑 + 执行工具”归并。Claude 与 ai-hub-maintainer 共享 Claude Code 工作站，后者的 read 权限、超时和并发限制不变。普通 command 脚本进入公共脚本工作站；已识别的模型 CLI 仍按 Codex、Copilot、OMP、Hermes、Pi 分类。

包裹仍携带原始 Agent 编号，原始编号映射到归并后的工作站；工作站统计与详情汇总所有成员配置。没有把脚本内容改写成任意命令，也没有更改现有任务的触发条件。

本机代理给 /v1/state 附加 localAgentReadiness，数据保存在 ~/.agent-autoloop/town-agent-readiness.json。它记录最近一次验证结果，不是服务实时探测。电脑在线与 CLI 登录状态分别显示。

检查：node checks/station-model.test.mjs。覆盖别名归并、脚本分类、统计汇总、不同电脑与空状态。
