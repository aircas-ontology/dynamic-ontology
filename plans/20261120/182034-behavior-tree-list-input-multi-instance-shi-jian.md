# Plan: behavior-tree-list-input-multi-instance

## 需求理解

行为树执行时，节点入参 `sourceType=LIST` 可多选实体实例；`inputParams[key]`：1 个仍传对象，多个传对象数组。对象可含 `dataPrimaryKeys`（草稿 rows 非空时）。非 LIST 保持单选。本期不做子表行多选 UI。

## 修改范围

- `behaviorTreeOrchestrationType.ts`：草稿增加 `entityPrimaryKeys: string[]`
- `postOntologyActionTreeTestType.ts`：`inputParams` 值支持对象 | 数组
- `BehaviorTreeExecPanel.vue`：LIST 多选；emit 支持 string | string[]
- `useBehaviorTreeExecution.ts` + 编排/测试/调度接线：写入多选草稿
- `behaviorTreeExecutePlan.ts`：序列化 1/N + dataPrimaryKeys
- `hydrateScheduleTreeParameters.ts`：回填数组为 entityPrimaryKeys
- `tests/behavior-tree-orchestration.test.mjs`

## 新增依赖

无。

## 验证方式

TDD → 相关测试 → 任务范围 `format:check`。
