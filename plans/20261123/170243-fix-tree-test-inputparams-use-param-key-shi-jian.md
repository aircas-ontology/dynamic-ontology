# Plan：行为树试跑 inputParams 改用入参名

## 需求理解

`POST /ontology/action/tree/test` 的 `nodeExecutes.*.inputParams` 应按各入参名分别传（如 `longitude`/`latitude`），不能再用共享/固定的 `paramName`（如 `trajectories`）。

## 修改范围

- `resolveBehaviorTreeInputParamRequestKey`：优先 `key`，缺省再回退 `paramName`
- 同步测试与类型注释

## 新增、修改和删除文件

- 修改：`src/utils/behaviorTreeExecutePlan.ts`
- 修改：`tests/behavior-tree-orchestration.test.mjs`
- 修改：`src/types/apis/getOntologyActionInfoType.ts`（注释）

## 核心实现方式

```ts
return String(param.key || param.paramName || "").trim();
```

LIST 多行仍按 `storageGroup` 组装 `dataPrimaryKeys`，仅外层键改为入参名。

## 新增依赖及必要性

无。

## 验证方式

- 更新并跑 `behavior-tree-orchestration` 相关测试
- `format:check` 任务文件
