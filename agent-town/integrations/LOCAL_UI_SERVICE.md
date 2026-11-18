# 本机网页服务

Agent 小镇网页与同源代理使用 8765，Autoloop 后端使用 3350，两者是独立进程。

2026-11-16 连接故障：3350 健康且仍运行 d783b97，8765 没有监听进程。旧网页服务由临时终端启动，没有系统托管，退出后不会自动恢复。已改用当前用户的 launchd 服务 cn.restry.agent-town。

从小镇开发目录执行部署命令。

```sh
cd ~/projects/agent-autoloop/agent-town
node scripts/install-local-service.mjs
```

脚本把 server.mjs、dist 与 integrations 复制到 ~/.agent-autoloop/town-ui/releases/<时间>/，注册 ~/Library/LaunchAgents/cn.restry.agent-town.plist。登录后自动启动，进程退出自动重启；只监听 127.0.0.1:8765。运行目录不依赖临时终端，也避免后台服务读取 Documents 工作目录的权限差异。密钥不写入 plist，服务在本机读取现有 config.json。

修改网页或代理后应重新执行部署命令，不能只改源码目录或临时运行另一个 server.mjs。部署信息写入 ~/.agent-autoloop/town-ui/deployment.json。日志位于 ~/.agent-autoloop/logs/town-ui.log 与 town-ui-error.log。

验证：页面、favicon 和代理状态接口正常；向受管网页进程发送 SIGTERM 后，launchd 启动新 PID，接口恢复 200。Codex 内置浏览器连接成功。没有重启 Autoloop 后端、改规则或重跑 PHP 同步；下一次仍为北京时间 2026-11-16 22:30。
