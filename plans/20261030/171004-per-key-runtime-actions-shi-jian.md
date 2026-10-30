# Fix per-container runtime action concurrency

## 需求理解

`FunctionOperatorContainerRuntimePanel.vue` 用全局 `actionSequence` 做启停并发控制。容器 A 请求未完成时容器 B 发起操作会抬高全局序号，导致 A 的 `finally` 跳过 submitting 清理。改为按 `containerKey` 独立维护序号。

## 修改范围

- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorContainerRuntimePanel.vue`
- 新增 `src/views/FunctionOperatorPanel/utils/containerRuntimeActionSequence.ts`
- 新增 `tests/function-operator-container-runtime-action-sequence.test.mjs`
- 更新 `tests/get-ontology-function-container-runtime-list-api.test.mjs`

## 新增、修改和删除文件

- 新增上述 util 与测试；修改面板与既有源码断言测试；无删除

## 核心实现方式

`createContainerRuntimeActionSequences()` 提供 `nextActionSequence` / `isCurrentAction` / `invalidateAllActionSequences`；启停重启按 key 比较；失活时清空 Map 与 submittingKeys。

## 新增依赖及必要性

无。

## 验证方式

TDD 后执行 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`、任务文件 `format:check`。
