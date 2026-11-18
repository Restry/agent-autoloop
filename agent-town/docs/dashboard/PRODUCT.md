# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

静态 HTML/CSS/JS（用户选定，零依赖、零构建）+ 本地 Node 代理服务（零依赖，注入本人密钥、代理 /v1 接口、解决跨域）。

## Users

Louis 一人。机器是自己的 Mac。两个使用姿势：挂在大屏上看 Agent 小镇的实时动态；人在跟前时当控制台，直接回答卡片、触发和暂停规则、叫停轮次。命令行里能做的操作，界面上都要能做。

## Product Purpose

给 agent-autoloop 中台（http://127.0.0.1:3350）做一个图形界面。中台本身故意没有界面，只留 HTTP 接口和命令行。这个看板是「本人」协议的一个客户端，和命令行地位相同。成功 = 用户日常不再需要打开终端就知道全局、能拍板。

## Positioning

不是普通仪表盘，是一张「活的地图」：每个可视对象都是真实系统对象的化身，包裹沿路跑就是真实轮次在流转。数据来自中台唯一权威接口，界面不虚构任何状态。

## Operating Context

- 数据源：本机中台的「本人」接口（GET /v1/state、GET /v1/stream、POST 卡片与规则操作、GET /v1/runs/<id>/why、GET /healthz）。
- 鉴权：本人密钥在 ~/.agent-autoloop/config.json 的 owner 字段。密钥不进浏览器，由本地代理注入。
- 真实对象模型：项目=规则（lines）、中台=hub、Agent=agents（claude 等）、通道=channels（desktop 等）、包裹=轮次（runs）、待拍板=卡片（cards）、来源=sources（local/schedule）。
- 每日循环：看全局（status）→ 回答卡片（answer/resolve）→ 触发/暂停/恢复/补跑规则（run/pause/resume/replay）→ 停轮次（cancel）→ 翻历史（runs）→ 看来龙去脉（why）→ 查花费（spending）。
- 管理类命令（doctor、check、--version、update）做成按钮，由代理服务 shell 调 CLI。uninstall/try/init/key 这类装机与破坏性操作不进界面。

## Capabilities and Constraints

- 全量状态一屏可见：在跑/排队/等拍板数、今日与本周 Token 与费用、各规则与 Agent 的分项用量。
- 卡片操作：选项按钮回答、文字回答、结案（resolve）。
- 规则操作：立即运行（run）、暂停（pause，可带原因和到点时间）、恢复（resume）、补跑（replay）。
- 轮次操作：叫停（cancel）、翻页看历史、看 why 时间线。
- 实时更新：/v1/stream 按 seq 续读，不漏不重；断线自动重连并全量刷新。
- 本地 only：代理只听 127.0.0.1，不对外。
- 规则名含中文和斜杠，URL 要编码。
- 卡片有版本（version）机制；answer 只有第一次算数。
- 中台离线时界面要能明说，不能装死。

## Brand Commitments

用户指定的 2D 地图隐喻（绑定）：左边一堆项目，一个项目一栋别墅；中间圆圈是中台；右边是 Agent 塔（Codex、Claude Code）；道路连接三者，干活就是包裹沿路运送；通道有路灯/驿站的味道。参考图（微信截图，夜间暖灯俯视小镇）：/Users/louis/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/michael-jason_833f/temp/RWTemp/2026-11/5dc4f035551259951d799b77bf07bfdf.jpg。先做 2D 平面，不做 3D。必须好用，且必须好看。

素材承诺（用户绑定）：场景实体——房子、树、传送带等——一律使用 polyfork.dev 的免费 3D 模型（GLB / ES module，商业许可），不手绘这些实体。站点：https://polyfork.dev/assets?q=house 。有成套城市套件（同一调色板与比例），three.js 可一行导入。

## Evidence on Hand

- 真实中台在跑：http://127.0.0.1:3350，commit c9ec4a187cab。
- /v1/state 真实样本：2 条规则（试一下、PHP线同步TS线）、1 个 Agent（claude，在线）、1 个通道（desktop，在线）、2 个来源（local、schedule）、轮次与卡片若干、spending.today/week。
- /v1/runs/<id>/why 返回事实时间线数组。
- 协议文档：/Users/louis/projects/agent-autoloop/docs/protocol.md（「本人」一节是接口真相）。
- 无现成 UI、无设计系统、无品牌资产。不得虚构用户、评价、数字。

## Product Principles

1. 地图即状态：每个可视对象只映射真实对象，不装饰、不编造。
2. 和命令行同等：命令行能做的，界面能做；界面不越权做破坏性装机操作。
3. 拍板最快路径：待回答卡片永远一屏内可达，一次点击完成回答。
4. 实时且诚实：seq 续读不漏不重；中台离线、规则报错、卡片发送失败都要明说。
5. 本地轻量：零依赖、零构建、秒开。

## Accessibility & Inclusion

未确立产品级要求。基本盘：文字可读、按钮可点、状态不只靠颜色区分。
