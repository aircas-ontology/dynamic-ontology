# 条件配置与行为参数双弹窗共存可拖拽

## 需求理解

规则画布内「条件配置」与「行为参数」弹窗可同时打开、互不关闭，且均可拖拽。Switch、规则配置全屏窗、变量选择等其它弹窗保持现状。

## 修改范围

- `src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleFlowDesigner.vue`
- 新增 `ScheduleRuleConditionEditorDialog.vue`、`ScheduleRuleActionEditorDialog.vue`
- `tests/schedule-rule-node-editing.test.mjs`、必要时 `tests/behavior-schedule-rule-canvas.test.mjs`

## 新增、修改和删除文件

- 新增：两个编辑弹窗组件
- 修改：Designer、相关测试
- 无删除；无新增依赖

## 核心实现方式

1. 拆分条件 / 行为 / Switch 三套独立可见状态。
2. 非对称并存：仅行为参数打开时可再开条件配置（只读对照）；条件配置已打开时禁止打开行为参数。
3. 条件与行为弹窗：`draggable`、`overflow`、`:modal="false"`、`modal-penetrable`、`append-to-body`。
4. Switch 弹窗保持原 modal / 不可拖拽行为。
5. `useRuleActionParameters` 可见性仅绑定行为弹窗。
6. 抽离子弹窗组件以保证 Designer ≤500 行。

## 新增依赖及必要性

无。

## 验证方式

- TDD：共存、拖拽/`modal=false` 断言；原确认回写用例适配新状态名。
- 相关 `npm test`、`format:check`、Vue 行数 ≤500。
