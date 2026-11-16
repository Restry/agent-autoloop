# Agent 小镇本地扩展

本工作分支基于 Restry/agent-autoloop 的 main（8e96e1c），保留官方协议和内核边界。网页客户端位于独立的 agent-town 仓库，不放入本仓库。

远端约定：origin 为 git@github.com:Restry/agent-autoloop.git；upstream 为 https://github.com/KKKKhazix/agent-autoloop.git。开发分支为 codex/agent-town，不直接改 main。

本地扩展包括规则文件读取/检查/保存 API、Claude 配置环境保留、同轮重试 scratch 目录授权、按轮次保存文件成果快照。整理中还修正了 HTTP 请求头到 Headers 的类型转换及环境变量回归测试的索引类型。

2026-11-16 验证：类型检查、格式检查、HTTP 14 项及针对性的 worker 3 项通过。快速套件共 806 项：781 通过、21 跳过、4 失败。飞书处理说明测试单独复跑通过；3 个数据库锁测试等待超时，其中“database held too long”在未应用本地补丁的 origin/main 基线上同样复现。没有为通过测试修改业务行为或测试预期，完整快速套件不能声明全通过。

运行安装目录 ~/.agent-autoloop/app 保留已验收的部署快照 deploy/agent-town-20261116（2d9b1be）；此次整理没有替换或重启正在运行的程序。它的 origin/upstream 同样指向上述 fork/官方仓库，local-source 保留本机源码目录作为部署来源。

后续先在本工作分支核对官方更新并验证，再选择部署提交。不要直接将官方版本覆盖到运行目录，也不要把规则、凭据、数据库或报告正文提交到 Git。本次未推送、未建 PR、未合入 main。
