# Agent 小镇 × Agent Autoloop：交接文档

- 交接时间：2026-11-15（北京时间 22:15）
- 交接对象：在本地继续开发的人或 AI 助手
- 阅读顺序：第 1 节（状态）→ 第 3 节（本地跑起来）→ 第 8 节（下一步）

## 1. 当前状态

**【状态：已验证】** 中台补丁的接口（跨域、规则文件读/检查/保存）在沙箱里对真实中台测试通过。

**【状态：已验证】** 小镇的数据逻辑通过了无画面模拟：演示模式、真实中台联调、空配置、大配置（14 组 58 规则 9 Agent）。

**【状态：已验证】** 本压缩包在新目录里能重新构建，产物与已发布页面逐字节相同；演示和快照两项无画面测试通过。

**【状态：已完成，未验证】** 以下内容从未在真实浏览器里运行过（开发环境没有浏览器）：

- 3D 画面效果、配色、转盘转动的观感。
- CSS 排版与所有 DOM 面板的显示。
- 鼠标点击、拾取、所有按钮操作。
- “更早的轮次”翻页。
- 规则保存后页面自动重载。
- Windows 上的中台安装与补丁应用。

**【状态：未做】**

- 包裹经过转盘时跟随盘面转动（现在包裹沿固定弧线走）。
- 中台上云（HTTPS 反向代理、“加一台电脑”引导页）。
- TUV 项目的真实规则和轮询脚本。
- GitHub Copilot CLI 的接入命令（中台没有 Copilot 插件，命令未核实）。
- 中台的类型检查（`tsc`）未运行。

## 2. 项目目标与约束

- 目标：给无界面的 Agent 调度中台 `agent-autoloop` 做一个 3D 小镇界面。
- 约束 1：界面只显示和操作中台真实支持的内容，不虚构功能。
- 约束 2：演示数据是独立入口，画面带“演示”标记。
- 约束 3：页面是单个 HTML 文件，Three.js 0.170.0 从 jsDelivr 加载，需要联网。
- 已定方案：一个分组（`group`）是一个院落，一条规则是院内一间小屋。
- 已定方案：界面可直接保存规则（因此修改了中台源码）。
- 已定方案：现阶段中台和页面都在本机；上云以后再做，结构已预留（`hub.ui.remoteRules`）。

## 3. 本地跑起来

### 3.1 前置条件

- Node.js 24 或更新（中台 `package.json` 要求 `>=24`，中台直接运行 `.ts`）。
- Python 3（只有构建和测试脚本需要）。
- Git（中台安装器需要）。

### 3.2 只看页面（不需要中台）

1. 双击 `dist/agent-town-autoloop.html`。
2. 选择“演示”入口。

### 3.3 连接真实中台

1. 按 `autoloop/agent-autoloop-main/INSTALL.md` 安装中台。
2. 把 `autoloop/ui-patch/host/` 里的 4 个文件覆盖到中台程序目录的 `host/`（默认 `%USERPROFILE%\.agent-autoloop\app\host`）。
3. 在 `%USERPROFILE%\.agent-autoloop\config.json` 的 `hub` 里加 `"ui": { "origins": ["null"] }`。
4. 重启中台：`agent-autoloop up`。
5. 双击页面，选择“连接中台”，填 `http://127.0.0.1:3350` 和 `config.json` 里的 `owner` 值。

- `"null"` 是双击打开的本地 HTML 文件的来源。
- 完整说明见 `autoloop/ui-patch/启动说明.md`。
- 中台执行 `agent-autoloop update` 后补丁会丢失，需要重新覆盖。
- 备选：用本包里已打好补丁的源码安装（`AGENT_AUTOLOOP_REPO` 指向 `autoloop/agent-autoloop-main`）；该目录不是 git 仓库，安装器是否接受未验证。

### 3.4 用假 Agent 做联调（沙箱里用过的方法）

1. 新建一个空目录作为数据目录，设环境变量 `AGENT_AUTOLOOP_HOME` 指向它。
2. 用安装器加 `--no-service --port 3350` 生成 `config.json`（参考 `sandbox/config.sample.json`，密钥由安装器生成）。
3. 把 `sandbox/rules.json` 复制进数据目录，并修改其中 3 类值：`worker` 名、`agent.sh` 路径、`cwd` 路径。
4. 启动：`node --disable-warning=ExperimentalWarning autoloop/agent-autoloop-main/bin/agent-autoloop.ts up`。
5. 发事件：同一命令把 `up` 换成 `emit issue.new --subject x`。

- `sandbox/agent.sh` 是 shell 脚本；Windows 上需要 Git Bash 的 `sh`，或改写成 PowerShell 脚本（存成带 BOM 的 UTF-8）。
- `sandbox/agent.sh` 里写死了 `/tmp/al/work/asked`，需要改成本地路径。
- `sandbox/q.mjs` 查询任意接口；`sandbox/t.mjs` 是规则接口的测试；两者读 `AGENT_AUTOLOOP_HOME`。

## 4. 目录说明

| 路径 | 内容 |
|---|---|
| `dist/agent-town-autoloop.html` | 当前交付页面（约 141 KB） |
| `town3/` | 页面源码与构建脚本 |
| `town2/app.js` | 旧版引擎源；`build.py` 按行号取段，**不要修改** |
| `tests/` | 无画面测试（含 Three.js 本体，供 Node 加载） |
| `autoloop/agent-autoloop-main/` | 已打补丁的中台完整源码 |
| `autoloop/ui-patch/` | 补丁包：`ui.patch`、`host/` 4 个文件、`启动说明.md` |
| `sandbox/` | 沙箱联调用的规则、假 Agent、测试脚本、配置样例 |

## 5. 页面源码结构

### 5.1 构建

```
python town3/make.py
```

- `make.py` 做 4 件事：运行 `build.py` 组装 `app.js`、`node --check` 语法检查、填入 `index.tpl.html` 的 `/*APP*/`、写出 `dist/agent-town-autoloop.html`。
- `build.py` 从 `town2/app.js` 按行号取引擎段落，再用字符串替换打补丁；替换目标缺失时报 `MISSING`。
- 改界面结构时直接改 `index.tpl.html`（`body.html`、`extra.css` 是它的来源稿，不参与构建）。

### 5.2 文件职责

| 文件 | 职责 |
|---|---|
| `p1_prelude.js` | 工具函数、连接信息 `conn`、`api()`、演示模拟器、入口选择 `chooseEntry()` |
| `p2_layout.js` | 中台位置、院落（分组）与小屋（规则）的排布、设施位置、镜头、标签 |
| `p3_yard.js` | 院落、规则小屋、来源站、通道楼、钟楼、无主货场、小棚的建模 |
| `p5_sim.js` | 包裹状态机：`addTask`、`updateTasks`、`applyState`、`refresh`、`startStream` |
| `p6_ui.js` | 顶部状态、分组面板、右侧详情面板、规则文件弹窗、按钮事件委托 |
| `p7_pick.js` | 鼠标拾取、窗口缩放、标签投影 |
| `build.py` | 组装顺序、对旧引擎的全部补丁、转盘转动代码 |

### 5.3 关键设计

- 三个入口：连接中台（可操作）、导入快照（只读，粘贴 `agent-autoloop status --json`）、演示。
- 数据刷新：读 `/v1/stream`（SSE），收到任意数据后 200 毫秒拉一次 `/v1/state`；另有每 3 秒检查、超过 10 秒强制刷新。
- 拓扑变化（规则、分组、Agent、来源、通道）时页面提示后整页重载；连接信息存在 `sessionStorage['agent-town-conn']`。
- 包裹对应轮次：`queued` 停在小屋门口；`claimed`/`unknown` 走传送带到工作台并停留到结束；结束后返回。
- 页面加载前已结束的轮次不生成包裹；90 秒内结束且被领取过的新轮次会补播动画。
- 中台返回的所有文本经过 `esc()` 转义，数字经过 `num()`。
- 每院最多画 6 间小屋；来源站最多 8、通道楼最多 6、小棚最多 3；超出的只在列表里显示。
- Agent 品牌按 id、名称、`use` 里的关键字匹配（claude、codex、copilot、hermes、omp、pi），其余显示通用终端造型。
- 转盘：平时 0.55 rad/s 慢转，包裹在 2.3 距离内时加速到约 2.45 rad/s，相邻转盘反向。
- 页面禁止内联事件处理器，按钮用 `data-act` 属性加事件委托。

### 5.4 画面与中台数据的对应

- 见 `autoloop/ui-patch/启动说明.md` 第 7 节。

## 6. 中台补丁

- 新增 `host/ui.ts`；修改 `host/server.ts`、`host/http.ts`、`host/config.ts`。
- 配置项：`config.json` → `hub.ui = { "origins": [...], "remoteRules": true }`；`origins` 为空时行为与原版相同。
- `GET /v1/rules-file`：返回 `{text, problem}`。
- `POST /v1/rules-file/check`：只检查，不保存。
- `PUT /v1/rules-file`：检查通过后保存，旧版备份为 `rules.json.bak`，然后触发重载。
- 3 个规则接口都需要本人密钥，默认只接受本机直连；带 `X-Forwarded-For`、`Forwarded`、`X-Real-IP` 头的请求返回 403。
- 补丁改变了原版“规则只由本机文件决定”的设计。
- 中台自带测试：修改前后都是 805 项中 761 通过、19 失败，失败清单相同；失败原因未逐项排查，推测与沙箱环境有关。

## 7. 测试

### 7.1 无画面测试（Node）

```
cd tests
python gen.py demo && node run_demo.mjs
python gen.py snap && node run_snap.mjs        （先设环境变量 SNAP=big.json 或 empty.json 的完整路径）
python gen.py live && node run_live.mjs        （先启动中台，并设 AGENT_AUTOLOOP_HOME）
```

- 通过标准：`STATIC` 行的 `fold`、`overlap`、`facHit`、`stationHit`、`treeHit` 为 0。
- 通过标准：`RUN` 行的 `offBelt`、`jump`、`nan` 为 0。
- `yardHit` 非零是设计结果（院落传送带贴着院台边缘），不是缺陷。
- `live` 测试约需 100 秒，会向中台发事件。
- `gen.py` 的原理：用桩对象替换 DOM、渲染器和音频，在 Node 里运行整个 `app.js`。
- 路径已从沙箱绝对路径改为相对路径；`demo` 和 `snap` 改后已运行通过，`live` 改后未重新运行。

### 7.2 浏览器测试（待做）

- 这是本地继续开发的第一项工作，见第 8 节。

## 8. 建议的下一步

1. 在浏览器里打开页面，按第 1 节“未验证”清单逐项检查，记录问题。
2. 给本地中台打补丁并连接页面，检查真实数据下的画面。
3. 决定是否让包裹跟随转盘转动（改 `build.py` 里的转盘段和 `ride()`）。
4. 核实 GitHub Copilot CLI 的无人值守命令，写入 `rules.json` 的 `agents`（`use: "command"`）。
5. 为 TUV 项目写规则：e2e 定时规则（`cron`）、问题平台轮询脚本或 HTTP 来源、通知通道。
6. 上云时：配置 HTTPS 反向代理，评估后再打开 `remoteRules`。

## 9. 已知限制与注意事项

- Agent 超过 6 个时，靠近中台的传送带互相贴近。
- 中台不提供 Agent 干活的中间步骤；包裹在工作台的停留时间等于该轮真实运行时间。
- `S.skipped` 是最近 20 条因暂停被跳过的事件，包含已补跑过的；所以“补跑”按钮不显示数量。
- 中台内置通道只有桌面通知、飞书、Webhook 模板；没有 Teams 通道。
- 本人密钥不能发事件、不能领活；这是中台的权限设计。
- `sandbox/config.sample.json` 里的密钥已删除；不要把真实 `config.json` 提交到代码库。

## 10. 待用户提供的信息

- 问题管理平台的名称和接口方式。
- e2e 测试的启动命令和工作目录。
- GitHub Copilot 的调用方式（CLI 命令或 ACP）。
