# Plan: basic-function-single-query-or-aggregate

## 需求理解

基础函数仅选 1 个对象时，可在「展示字段（QUERY）」与「聚合（AGGREGATE）」间二选一；单对象聚合也需可配置回写写入字段。多对象仍仅聚合。

## 修改范围

- `BehaviorFormDialog.vue`：单对象结果模式切换；按模式显隐展示字段 / 聚合 / 写入字段；切换清理；编辑回显；校验
- `tests/ontology-space-behavior.test.mjs`：覆盖二选一与单对象聚合写入字段显隐

## 新增、修改和删除文件

- 修改：上述文件
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. `basicFunctionSingleResultMode: "query" | "aggregate"`，单对象默认 query。
2. `showBasicFunctionSelectFields` = 单对象且 query；`showBasicFunctionAggregateFields` = 多对象或（单对象且 aggregate）。
3. `showBasicFunctionMultiWriteField` = 与聚合表单项同显（多对象或单对象聚合），复用现有 `basicFunctionMultiWriteField` 与 `buildAggregateWriteBack`。
4. 切换模式清空另一侧；编辑时有 `aggFunc` 则回显为 aggregate 并保留写入字段。

## 新增依赖及必要性

无。

## 验证方式

更新测试 → 相关测试 → 任务范围 `format:check`。
