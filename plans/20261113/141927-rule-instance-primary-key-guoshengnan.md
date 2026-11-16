# 需求理解

修复选择变量弹窗实例数据不显示的问题。用户确认仅使用接口实际字段 primaryKey，不兼容 entityPrimaryKey 或 id。

# 范围与实现

- 修改 useRuleVariablePicker.ts 的实例标识读取为 primaryKey；名称沿用 displayName，选中值规范化为字符串。
- 修改 tests/schedule-rule-variable-picker.test.mjs：使用实际接口结构覆盖六条实例映射、数字和字符串主键，以及不读取旧字段的边界；更新已有实例分页测试数据。
- 新增本 Plan；不删除文件、不修改共享接口类型、其他调用方或依赖，保留工作区原有修改。

# 验证

先更新行为测试并运行失败，再最小修复运行通过。执行相关测试、npm test、test:coverage、type-check、build:verify、本次文件格式检查与 git diff --check。当前无浏览器工具，不声明实际页面验收；如实记录既有全量检查失败。

# 验证结果

- 已仅使用 primaryKey，移除 entityPrimaryKey/id 回退；displayName 显示逻辑不变。
- 更新数据结构后测试先出现 4 项失败；最小修复后相关测试 23/23 通过。覆盖用户提供的六条飞机记录、数字 0、字符串主键、旧字段不再读取、分页与过期响应。
- build:verify、三文件格式检查、git diff --check 通过。
- npm test：996 项，963 通过，33 项既有失败，与此前一致。
- test:coverage 未通过：已加载文件行 92.38%、函数 88.47%、分支 77.38%，分支低于 80%；不是全项目源码覆盖率。
- type-check 因既有 API 与页面类型错误未通过，本次 composable 无报错。
- 未实际操作浏览器或重新请求该内网接口；验证依据用户返回样本与真实解析逻辑，人工页面验收待完成。
