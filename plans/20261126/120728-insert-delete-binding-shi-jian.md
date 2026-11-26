# insert/delete 主表免实例、子表仅实例

## 需求理解

条件为「新增」(`insert`) 或「删除」(`delete`) 时：主表属性不配置实例且不传 entityId/dataPrimaryKey；子表属性只配置实例、不选不传数据行。`update` 与无 monitorType 保持现状。

## 修改范围

| 动作 | 文件                                                                              |
| ---- | --------------------------------------------------------------------------------- |
| 修改 | `src/views/SpaceBehaviorScheduleWorkspace/utils/needsRuleVariableDataRow.ts`      |
| 修改 | `src/views/SpaceBehaviorScheduleWorkspace/utils/ruleConditionInstanceBindings.ts` |
| 修改 | `src/views/SpaceBehaviorScheduleWorkspace/utils/buildRuleScheduleCreateParams.ts` |
| 修改 | `ScheduleRuleConditionInstanceRow.vue` / `ScheduleRuleConditionInstances.vue`     |
| 修改 | 相关测试与文档口径说明                                                            |

## 核心实现方式

1. `readRuleVariableBindingRequirement(storageGroup, monitorType)`
2. 路径收集过滤无需绑定的变量行；子表行隐藏数据行
3. 校验与 `buildRuleOperand` 按需求省略字段

## 新增依赖

无。

## 验证方式

- 相关 node --test
- format / type-check / build:verify
