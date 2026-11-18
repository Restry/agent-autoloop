# Claude 环境变量保留补丁

修正 worker/worker.ts 的 agentEnvironment：保留 CLAUDE_CODE_* 配置变量，包括子 Agent 模型、后台等待时限及未来自定义设置。只移除明确的父会话标记：CLAUDECODE、CLAUDE_CODE_SESSION_ID、CLAUDE_CODE_PARENT_SESSION_ID、CLAUDE_CODE_ENTRYPOINT、CLAUDE_CODE_SSE_PORT、CLAUDE_CODE_SSE_TOKEN。

AGENT_AUTOLOOP_* 仍过滤后重新设置本轮 HOME/RUN/CONTEXT；CODEX 的原过滤规则保持不变。ANTHROPIC_* 和代理配置沿用原来的继承规则。

补丁已应用到本机 ~/.agent-autoloop/app。包含真实子进程环境回归测试，验证配置被继承、旧会话及中台密钥被剔除。相关两个 worker 测试、八项 purity 测试通过。

文件变化要在接单程序重启后才生效；已启动的 Claude 无法从父进程补收环境变量。当前仍执行的业务轮次不强制停止。重启前确认没有执行中的轮次；重启后新启动 Claude 会使用补丁。它只能保留启动中台时已经存在的变量；系统服务没有继承到的 shell 变量仍须由服务环境或现有 program 启动脚本配置。

程序自动更新可能覆盖本地补丁。重新应用前先运行 git apply --check。
