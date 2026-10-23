# 函数编排工作流保存

## 需求理解

按 `docs/20261023/shijian.md`，点击编排画布「保存」时调用 `docs/20260923/6.createFunApi-shijian.md` 的创建接口（已有 `createOntologyFunctionInterface`）。

请求体形状：

- `functionApi` / `version` / `displayName` / `description` / `ontologySpaceId`：来自新建表单通用配置
- `type`: `"COMPOSITE"`
- `compositeConfig`：等于当前 `buildCompositeWorkflowSavePayload` 返回值

本任务只做新建 POST；不接编辑 PUT / `compositeConfig` 回填。

## 修改范围

- 类型：`CreateOntologyFunctionType` 增加 `COMPOSITE`，`CreateOntologyFunctionParams` 增加 `compositeConfig`
- 画布：校验后组装创建请求体，去掉 console.log
- Dialog / Form / Workspace / index：接线 `saveCompositeOperator`

## 新增、修改和删除文件

- 修改 `src/types/apis/createOntologyFunctionType.ts`
- 修改 `src/apis/functionApi.ts` JSDoc
- 修改 `src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts`
- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeWorkflowDialog.vue`
- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- 修改 `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts`
- 修改 `src/views/FunctionOperatorPanel/index.vue`
- 修改 `tests/create-ontology-function-api.test.mjs`
- 修改 `tests/function-operator-workspace.test.mjs`

不新增、不删除业务源码文件。

## 核心实现方式

校验通过后组装 `{ functionApi, version, displayName, description, type: "COMPOSITE", ontologySpaceId, compositeConfig }`，经 Form 转发至工作区调用 `createOntologyFunctionInterface`，成功后关表单并刷新列表。

## 新增依赖及必要性

无。

## 验证方式

先更新断言并确认失败，再实现。执行相关测试、`npm run type-check`、`npm run build:verify`、以及对本次文件的 `npm run format:check`。
