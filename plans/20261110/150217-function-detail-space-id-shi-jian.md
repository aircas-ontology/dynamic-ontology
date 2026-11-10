# 函数详情接口补充 spaceId

## 需求理解

按 `docs/20260924/getFunInfoApi-shijian.md`，`GET /ontology/function/detail` 入参加必填 `spaceId`。同步类型、API 注释、全部调用方与单测。

## 修改范围

- `src/types/apis/getOntologyFunctionDetailType.ts`
- `src/apis/functionApi.ts`
- `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- `src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeFunctionNodeDialog.vue`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeWorkflowDialog.vue`（向子组件传 spaceId）
- `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- `tests/get-ontology-function-detail-api.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. `GetOntologyFunctionDetailParams` 增加 `spaceId: string`
2. 全部 `getOntologyFunctionDetailInterface` 调用传入当前空间 id
3. Composite 节点弹框补 `spaceId` prop 并由父组件传入

## 新增依赖

无

## 验证方式

- `node --test --experimental-strip-types tests/get-ontology-function-detail-api.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`
