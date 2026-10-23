# 函数编排工作流回显

## 需求理解

点击列表「编辑」后，已有 `getOntologyFunctionDetailInterface` 拉取详情。本任务把返回的 `data.compositeConfig`（与保存时 `buildCompositeWorkflowSavePayload` 同形）传到编排画布，用其中的 `graph.logicFlow` 调用 LogicFlow `render` 回显节点与连线（含 `properties` 中的绑定/配置）。

不改变新建保存（仍 POST）；不接编辑 PUT；不改编排画布内「测试」。

## 修改范围

1. `src/types/apis/getOntologyFunctionDetailType.ts` — `compositeConfig?: CompositeWorkflowSavePayload`
2. `src/types/pages/ontologyFunctionOperatorType.ts` — 草稿可选 `compositeConfig`
3. `src/utils/mapOntologyFunctionDetail.ts` — COMPOSITE 写入草稿
4. `src/views/FunctionOperatorPanel/utils/compositeWorkflowGraph.ts` — `resolveCompositeWorkflowLogicFlowForRender`
5. `src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts` — initial 配置 render + fit
6. `FunctionOperatorCompositeWorkflowDialog.vue` / `FunctionOperatorFormDialog.vue` — 传 `compositeConfig`
7. 相关测试

不改 Mock fixture；不新增依赖/业务源码文件。

## 核心实现方式

详情 → draft.compositeConfig → Form → Dialog → canvas `lf.render(logicFlow)`；仅依赖 `graph.logicFlow`。

## 新增依赖及必要性

无。

## 验证方式

TDD 后执行相关测试、`format:check`（本次文件）、`type-check`、`build:verify`。
