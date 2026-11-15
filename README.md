# Agent 小镇

第一阶段的实时 3D 场景原型。使用本地保存的 Three.js 0.170.0，不依赖外部 CDN。

## 本地运行

在本目录运行：

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

浏览器打开 http://127.0.0.1:8765/ 。请通过 HTTP 运行，直接双击 HTML 不支持 ES 模块加载。

## 场景

- 六个项目院落。每个院落包含主楼和三个独立小工作区。
- 圆形调度中台，以及 Claude、Codex、GitHub Copilot 三座工作站。
- 开放式双向传送带。纸箱在带面上移动，带面有运动纹理。
- 模拟任务经过项目、中台、Agent、返回项目四个阶段。
- 点击别墅后，镜头平滑拉近，显示三个独立工作区的任务。
- 点击工作区或任务卡片可查看具体任务，并派送给对应 Agent。
- 点击传送带上的包裹可查看任务、Agent、当前位置和实时状态。包裹完成后详情仍保留。
- 包裹详情可跳转到所属工作区；关闭项目或点击“回到全景”可平滑返回。
- 支持镜头旋转、缩放、回到全景、白天/夜晚、暂停和标签开关。

## 文件

- `dist/app.js`：模型、灯光、传送带、任务模拟、交互。
- `dist/style.css`：界面和响应式布局。
- `dist/index.html`：网页入口。
- `dist/models/`：Polyfork GLB 模型、下载清单与署名页。
- `dist/vendor/`：Three.js 及其扩展，许可证见 `THREE-LICENSE.txt`。

## 当前范围

任务及项目资料均为演示数据。尚未接入真实 Codex、Claude、项目数据库或任务持久化。住宅、树木、庭院配件和纸箱采用 Polyfork 的 18 个本地 GLB 模型；传送带、工作区底座、圆形玻璃中台和 Agent 动态装置由本项目制作。主视图以桌面为重点；尚未完成移动设备性能验证。

当前版本默认明亮的白天模式，也可以切换到夜晚。保留开放式传送带和主楼侧面的工作区。模型来源与各自许可见 `dist/models/credits.html`，原始下载信息见 `dist/models/manifest.json`。

植物包括用户指定的 Trimmed Foundation Shrub，以及 Sculpted Pine、Birch Tree、Maple Tree。采用网页公开加载的 HD 预览 GLB，不是完整 HD 下载版。这四个文件适用 Polyfork 商业许可，不按 CC BY 再授权；其余免费模型保留对应署名。

任务仍为模拟数据。每个工作区有独立任务定义，包裹、工作区状态和 Agent 状态使用同一任务记录。

## Agent 立体图标

三座工作站使用有厚度与倒角的品牌图标网格，替换圆球和文字贴片。Codex 图标来自 Devicon；Claude 和 GitHub Copilot 来自 Simple Icons，来源和许可见 `dist/icons/NOTICE.md`。

演示任务按工作区分配：设计室使用 Claude，开发室使用 Codex，验证室使用 GitHub Copilot。三个 Agent 均有独立的传送带、包裹颜色、任务计数和执行状态。

Claude 工作站现在直接使用用户提供的 `1.glb` 默认场景：橙色圆角方形底座与白色立体标志。Codex、GitHub Copilot 使用相同风格的圆角厚底座。每座工作站保留两道大圆环，并分别旋转。
