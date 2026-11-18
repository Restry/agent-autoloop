# 飞书接入准备

状态：正式通道已启用。专用配置为 autoloop；既有 omp 仍是 CLI 默认配置，原有 OMP 消费者不受影响。

真实验收通过：本人选择“确认收到”，中台记录回答、启动第2轮确定性测试、完成测试，并将原卡片更新到版本3。生产接入仅新增 channels.feishu，保留 desktop，规则定义和 group 不变。

运行文件位于 `~/.agent-autoloop/integrations/feishu/`，凭据仅保存在权限0600的正式 config.json。启用前已完成完整备份，位置见 activation-result.json。中台系统服务已重载，现有PHP同步轮次的状态及重试次数保持不变。

新通道已订阅 card.action.trigger，限定本人 open_id 回答。后续需要决定的卡片会投递到飞书；在飞书或小镇回答都回到同一中台。

验收记录：live-test-status.json；生产启用记录：activation-result.json；当前接入检查：setup-status.json。下面保留准备过程记录。

## 已核实

- 本机 lark-cli 1.0.92 支持作者插件所用的消息发送、卡片更新、幂等键及 card.action.trigger 消费命令。
- omp 配置登录用户为刘炜，用户令牌有效，机器人凭据可用。puyang 配置的用户令牌过期。
- 对 omp 执行 card.action.trigger 的 dry-run 返回 ready；这不是实际发送或回调验收。
- 同一应用已有卡片消费者。其父进程属于 `/Users/louis/projects/omp-feishu-bridge/bin/omp-feishu.mjs`。不停止、不替换该进程。
- 作者技能约定同一飞书应用的卡片点击监听只在一个地方运行。专用 AutoLoop 应用可避免与现有桥接共用回调；如复用，需先设计回调路由，不能盲目加第二套监听。
- 已安装与参考源码中的飞书插件 SHA-256 一致。作者 11 项相关测试通过：卡片展示、首次发送、原位更新、回调、文字回答、幂等和失败处理。测试使用假 CLI，没有在真实飞书账号上发卡。

## 已备文件

- `rules.patch.json`：只增加飞书通道和回答人名单；不改现有规则、分组或桌面通知。
- `config.patch.json`：飞书通道运行参数；密钥与 open_id 仍为占位符。
- `lark-profile.mjs`：固定所选 CLI profile，转发标准输入和退出码，避免全局账号切换造成误投。
- `lark-settings.json`：用户已选择独立机器人，profile 固定为 autoloop；专用应用已创建成功，仍待启用卡片回调和完成本人身份授权。
- `preflight.mjs`：只读检查；不启动事件消费、不发送、不建密钥、不编辑配置。
- `test-card.json`：使用已安装的官方插件 render 生成的验收卡片，仅保存 JSON，未发送。
- `validation.json`：合并通道草稿后的规则校验结果。临时规则文件已清理。
- `preflight-result.json`：当前 omp 的检查结果，不含凭据。

运行只读检查：

```sh
node preflight.mjs --profile omp
```

## 确定机器人后

1. 选定专用应用或复用应用；固定 profile。专用应用需配置机器人和卡片回调，取得该应用下本人的 open_id。不要把其他应用的 open_id 直接沿用。
2. 复核私聊接收人和唯一回答人。配置只面向本人，不加入群聊。
3. 在独立测试中台完成“发验收卡片 → 本人点击 → 中台记回答 → 测试任务续办 → 卡片更新”。这一步才验证真实链路。
4. 启用正式通道前，取得创建通道密钥的明确授权，检查当前运行轮次和服务重启影响；只合并 channels 配置，保留全部规则与 group。
5. 检查新通道是否会领取已有待处理卡片，确认后再启用正式投递。保留桌面通道，除非另有要求。
6. 小镇会从 channels 自动显示飞书状态。飞书通道不是规则，不创建虚构规则组或别墅。

上游：https://github.com/KKKKhazix/agent-autoloop/tree/main/plugins/feishu
