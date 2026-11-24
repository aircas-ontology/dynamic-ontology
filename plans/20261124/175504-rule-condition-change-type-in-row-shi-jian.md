# 变更类型移到条件行内选择

## 需求理解

去掉配置条件弹框顶部「变更类型」；在每条条件卡片最左侧用下拉选择属性比较 / 新增 / 删除。

## 修改范围

条件编辑 UI、监测叶子类型、build/restore/factory、相关测试；不改 Switch 与行为参数。

## 新增、修改和删除文件

- 修改：ScheduleRuleConditionEditorDialog.vue、ScheduleRuleConditionEditor.vue、WireSurface、factory、build、restore、类型、monitor 测试
- 修改：RuleMonitorLeafCondition 增加行级 monitorType
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. 移除 Dialog 顶部 radio。
2. 叶子/监测行首增加变更类型 select；切换时 emit replace 就地转换节点。
3. 监测叶子必填 monitorType；提交时同组统一写组级，混用 insert/delete 写条件项级；禁止与属性比较混用。
4. 添加子条件默认属性比较。

## 新增依赖及必要性

- 无

## 验证方式

- 更新并运行 rule-condition-monitor 及相关规则测试
- format:check；build:verify
