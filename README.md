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
- 圆形调度中台，以及 Claude、Codex 两座工作站。
- 开放式双向传送带。纸箱在带面上移动，带面有运动纹理。
- 模拟任务经过项目、中台、Agent、返回项目四个阶段。
- 点击项目可查看信息和派送演示任务。
- 支持镜头旋转、缩放、回到全景、白天/夜晚、暂停和标签开关。

## 文件

- `dist/app.js`：模型、灯光、传送带、任务模拟、交互。
- `dist/style.css`：界面和响应式布局。
- `dist/index.html`：网页入口。
- `dist/models/`：Polyfork GLB 模型、下载清单与署名页。
- `dist/vendor/`：Three.js 及其扩展，许可证见 `THREE-LICENSE.txt`。

## 当前范围

任务及项目资料均为演示数据。尚未接入真实 Codex、Claude、项目数据库或任务持久化。住宅、树木、庭院配件、中台建筑和纸箱采用 Polyfork 的 20 个本地 GLB 模型；传送带、工作区底座和 Agent 动态装置由本项目制作。主视图以桌面为重点；尚未完成移动设备性能验证。

当前版本默认明亮的白天模式，也可以切换到夜晚。保留开放式传送带和主楼侧面的工作区。模型来源与 CC BY 4.0 署名见 `dist/models/credits.html`，原始下载信息见 `dist/models/manifest.json`。
