# 作者插件和任务模板核对

核对时间：2026-11-15。在线读取作者仓库 main 的 README、plugins 和 examples/recipes 目录，并核对本地各模板 README。以下是可选方案，不代表已经安装、授权或启用。

作者仓库：https://github.com/KKKKhazix/agent-autoloop

## 内置插件（12 个目录）

| 类别 | 插件 | 在小镇中的作用 |
| --- | --- | --- |
| 执行者 | claude、codex、acp、dsh、zcode、command | agents 配置中的真实 Agent 自动显示为工作站；安装插件本身不产生工作站 |
| 事件来源 | github、gitlab | 接收对应 Webhook，匹配规则后创建轮次；也可用 HTTP、定时和轮询 |
| 通知通道 | desktop、feishu、webhook | 显示在通道面板；飞书支持卡片点击，Webhook 模板覆盖钉钉、企微、Slack、Discord，文字通道的回答链接需可达 |
| 交付 | delivery | 按已有规则处理审查、CI、合并、发布与健康检查 |

## 可选任务

| 建议顺序 | 名称 / 路径 | 做什么 | 启用条件 |
| --- | --- | --- | --- |
| 第一批 | website-watch | 每 5 分钟检查健康接口和内容；异常交 Agent，恢复后收尾 | 明确真实健康地址；检查机应在被查服务之外；先模拟异常验证 |
| 第一批 | morning-brief | 每天整理本地笔记、提交并写早报 | 指定资料目录、时间和 Agent；原模板不用联网 |
| 第一批 | github-issues | 每 5 分钟读新 Issue，改本地代码并通知 | gh 登录、仓库、起始日期和干净目录；原模板不提交、不推送、不回复 Issue |
| 第二批 | ops-alerts | 读取报错和代码，定位原因，需重启时询问 | 告警来源与固定运维工具；示例重启脚本仅打印文字 |
| 第二批 | feedback | 接反馈、核实、修复、准备回复，决定后继续 | 真实反馈系统的读取、认领和回复入口；模板不自建工单库 |
| 第二批 | feishu-brief | 汇总本人有权读取的汇报和表格，生成周报 | 指定汇报、人员、表格和读取权限；默认周日18点 |
| 第二批 | inbox-triage | 飞书邮箱未读邮件分类，生成本地回复草稿 | 飞书邮箱本人权限；原模板不发送、不改已读、不归档 |
| 后续 | delivery | PR 审查、等CI、合并、发布并核实版本 | 仓库 main 上的交付策略、检查和发布链路；有真实外部写操作 |
| 后续 | browser-handoff | 主 Agent 委托已连接浏览器的 Codex，再接回结果 | 须验证后台浏览器入口，不能假定可使用当前 Codex 右侧浏览器 |
| 后续 | examples/skills/weekly-sweep | 定期检查冗余代码并清理、交付 | 原技能会修改和删除代码；建议先改为只提建议，选定后再确定允许范围 |

前八个任务中的 browser-handoff 等共八个 recipe 目录；delivery 是插件/配置流程，weekly-sweep 是独立 Skill，不能把它们都称为已安装规则。

## 放入小镇的方式

先根据工作并发关系确定真实 group，再合入后端 rules.json。小镇只读取实际配置：group 生成别墅，规则生成工作区，运行生成包裹，Agent 生成工作站。上述清单不提前生成演示别墅，也不改变 PHP 同步组。
