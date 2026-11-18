# 简报与院落 GitHub 配置

## 当前配置

- 科技与 AI 早报：北京时间每天 08:00 采集科技和 AI 新闻，随后由 Codex 生成报告。
- 项目进展日报：每天 08:10 采集登记项目的 Git 状态与中台任务，随后生成报告。非 Git 的项目父目录会检查一级子仓库；仍无法读取的目录明确记为未知。
- 网站巡检与异常排查归入同一个“AI Hub 网站巡检”院落，保留两条原规则及原执行工具。
- 报告保存在 ~/.agent-autoloop/work/daily-morning/briefs/ 和 daily-projects/briefs/。早报优先最近24小时新闻，不足时补充72小时内资料并标明发布时间；每条附来源链接。
- 规则时区由中台返回值确认是 Asia/Shanghai。报告默认留在本机，轮次结果提供路径。

## GitHub

点击院落中的“配置 GitHub 仓库”，或顶部“接入 GitHub”。配置仓库、已存在的本机 Git 目录、模型 Agent、频率和标签。默认从启用时开始跟进新 Issue；勾选后才纳入现有 Issue。

配置保存在 ~/.agent-autoloop/town-projects.json。每个院落生成独立 source、固定轮询脚本配置及“检查 GitHub Issue / 跟进 GitHub Issue”两条规则。仓库与目录先经 gh 和 git 核实，再调用中台原有规则检查/保存接口。页面不保存账号密钥。

轮询脚本基于官方 examples/watch-github-issues.sh，改成参数数组、分页、排除 PR、仓库级稳定事件编号和每轮最多 100 条的循环批次。批次轮转不依赖成功游标，遗漏的批次会在后续循环重试；重复事件由中台去重。Issue 正文只作为资料。本地处理不提交、不推送、不回复 GitHub，也不主动发送外部消息。

保存使用配置版本校验；有相关 GitHub 轮次未结束时拒绝修改，避免换仓库后处理旧任务。停用只移除该院落生成的两条规则，其他院落规则保留。

## 后台部署与验证

执行 node integrations/project-tasks/deploy-runtime.mjs，把采集/轮询脚本部署到 ~/.agent-autoloop/lib/town-project-tasks。后台入口使用该目录，避免依赖 GUI 应用对 Documents 目录的访问权限。

执行 node checks/project-tasks.test.mjs。覆盖多项目隔离、规则解析、检查不写入、版本冲突、活动轮次保护、停用、Issue 去重与分批、北京时间日期、真实中台回执格式。

本机已实际跑通两份报告的“采集 → 派给 Codex → 写报告”。GitHub 配置已用真实公开仓库验证读取、目录和规则检查；保存使用隔离测试中台验证，尚未替用户启用任何真实仓库的 Issue 跟进。

同一本机工作目录不能同时绑定到两个已启用的院落，避免并发修改同一份代码。首次修改前的中台规则保存在 ~/.agent-autoloop/rules.before-project-tasks.json。

新闻来源：OpenAI、Google AI、The Verge、TechCrunch 的公开 RSS/Atom。只采集标题与摘要，不声称已阅读全文；来源失败会记录，全部失败时不生成报告。采集脚本为 collect-news.py，部署到后台运行目录。

科技新闻早报使用 YYYY-MM-DD-tech-ai.md，资料文件和派发事件同样带新闻类型编号。旧待办版 YYYY-MM-DD.md 保留，不能阻止新闻版生成。

## AIHOT 接入

已读取本机 ~/.claude/skills/aihot/SKILL.md（2.0.0）及服务说明。定时采集使用 AIHOT JSON /api/v1/items 接口的24小时精选，匿名 GET，不发送本机任务或凭据。新闻文字只作为资料，报告注明 AIHOT、原始来源及北京时间，标题链接到 AIHOT 阅读页。失败时如实记录，不回退到 RSS 冒充 AIHOT。

科技与 AI 早报使用 YYYY-MM-DD-aihot.md，与旧 RSS 版、待办版分开。项目进展日报保持原路径，旧报告保留。规则修改前备份为 ~/.agent-autoloop/rules.before-aihot.json。时间为08:00和08:10 Asia/Shanghai。

检查：node checks/aihot.test.mjs，覆盖 GET、重试、空结果、失败、链接校验及报告文件名。已通过真实中台采集和报告生成。
