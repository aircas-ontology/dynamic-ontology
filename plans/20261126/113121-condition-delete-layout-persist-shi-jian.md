# 条件删除布局与持久化

## 需求理解

1. 「删除」按钮要紧挨条件表单，不要被撑到卡片最右侧。
2. 删除子条件并点「确定」后，再次打开配置应不再出现已删项。

## 修改范围

| 动作 | 文件                                                                                  |
| ---- | ------------------------------------------------------------------------------------- |
| 修改 | `src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleConditionEditor.vue` |
| 修改 | `src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowGraphSession.ts`      |
| 修改 | `tests/behavior-schedule-rule-canvas.test.mjs`（或等价测试）                          |

## 核心实现方式

1. 叶子卡片按内容收缩，删除按钮贴在表单右侧。
2. `updateNodeData` / `updateActionWithConditions` 使用 `setData(..., { overwrite: true })`，避免 lodash merge 残留已删 children。
3. 按 `child.id` 从 children 移除。

## 新增依赖

无。

## 验证方式

- 相关 node --test
- format:check / type-check / build:verify
