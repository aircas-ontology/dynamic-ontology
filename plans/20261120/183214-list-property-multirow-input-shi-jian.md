# Plan: list-property-multirow-input

## 需求理解

`executeInputs.nodes[].inputParams[]` 三条同时满足才允许多选：

- `valueType === "LIST"`
- `sourceType === "PROPERTY"`
- `storageGroup` 非空且 `!== "main"`

UI：单选实例 + 多选子表行；请求键用 `paramName`；每行 `{ entityPrimaryKey, dataPrimaryKeys: { [storageGroup]: rowId } }`；1→对象 / N→数组。撤销按 `sourceType=LIST` 多选实体。

## 修改范围

- 类型：`BehaviorTreeExecuteInputParam` 增加 `paramName`/`storageGroup`；草稿增加 `rowKeys`
- ExecPanel / useBehaviorTreeExecution / behaviorTreeExecutePlan / hydrate
- 测试与本 Plan

## 新增依赖

无。

## 验证方式

TDD → 相关测试 → 任务范围 format:check。
