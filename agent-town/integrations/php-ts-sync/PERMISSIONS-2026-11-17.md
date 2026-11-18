# 已批准权限落地

原因：Autoloop 确认卡记录业务授权并触发续办，不会自动修改 Claude 的项目权限。原来仅放行 prepare/verify 两个入口，导致已批准的直接 Git 查询和保存/合并操作仍被 Claude 拒绝。

已在 /Users/louis/projects/GenFlow/.claude/settings.local.json 添加按仓库绝对路径与 Git 动词限定的允许项。四仓可查询版本与状态、fetch origin；三个业务仓库可暂存和合入 origin/main、以 --no-edit 结束合并；TS 后端可按 -m 保存提交。没有新增 push、reset、clean、任意 Shell 或 bypassPermissions。原有用户配置保留。详细新增条目在 approved-permissions.json。

技能和可信规则提示同时更新，明确已批准的保存提交与 main → 当前工作分支合并，不再让旧的“只能快进、禁止创建提交”要求覆盖用户决定。prepare 遇这些状态先按授权处理，再重跑 prepare。无法判断的业务冲突不属于自动扩大授权。

真实后台验证：第 180 轮由中台使用正式 claude Agent、正式项目 cwd 和 acceptEdits 模式启动。9 条独立 Bash 调用包含业务仓库 status/log/show/rev-parse，以及独立测试仓库的 add、commit 和非快进 merge。返回 PERMISSION_PROBE_OK，permission_denied 为 0；实际 Git 记录包含保存提交和合并提交，origin/main 是测试仓库 HEAD 的祖先，测试工作区干净。测试没有修改业务代码。

测试规则及测试路径的临时允许项已清理。第 13 张旧权限通知已记录验证结果并结案，第 14 张确认卡依据用户本次明确指令继续，生成第 181 轮。181 已成功执行 GemFlow-Services 的 git status --porcelain，当前无权限拒绝。没有重启中台或另开独立业务同步；保留原任务链。

这是具体项目权限修复，不是把任意确认卡文字直接翻译成权限。以后只有明确、受限且经授权的操作才应写入允许清单。
