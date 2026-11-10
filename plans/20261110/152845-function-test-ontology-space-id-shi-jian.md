# 函数测试请求补充 ontologySpaceId

## 需求理解

`docs/20261021/api-container-test.md` 在 `POST /ontology/function/execute` body 增加 `ontologySpaceId`（对象空间 id）。仓库内没有 execute 接口封装或调用；实际相关路径是 `testOntologyFunctionInterface`（`POST /ontology/function/test`），且 `docs/20260924/testFunApt-shijian.md` 请求示例已含 `ontologySpaceId`，但 `TestOntologyFunctionParams` 与组装/调用尚未传递。

类型约定：与同域创建/更新 body 的 `ontologySpaceId: number` 对齐（文档中的 `""` 视为占位）。

## 修改范围

- 类型：`src/types/apis/testOntologyFunctionType.ts` — 增加必填 `ontologySpaceId: number`
- API JSDoc：`src/apis/functionApi.ts`（`testOntologyFunctionInterface`）
- 组装：`src/utils/mapOntologyFunctionTest.ts`
  - `buildOntologyFunctionTestRequest` / `buildOntologyFunctionScriptTestRequest` 增加并写出 `ontologySpaceId`
- 调用：
  - `useFunctionOperatorWorkspace.ts`：预览、`runTest`、`runScriptTest` 传入 `spaceId.value`
  - `FunctionOperatorScriptIdeDialog.vue`：`props.spaceId`
  - `FunctionOperatorCompositeWorkflowDialog.vue`：`props.spaceId`
- 单测：`tests/test-ontology-function-api.test.mjs`
- Plan 保存 `plans/20261110/`

## 新增、修改和删除文件

- 修改：上述类型、API、组装器、调用方与单测
- 新增：本 Plan 文件
- 删除：无

## 核心实现方式

1. `TestOntologyFunctionParams` 增加 `ontologySpaceId: number`。
2. 两个 build 函数 options 增加 `ontologySpaceId`，写入请求体。
3. 各调用点用当前空间 `spaceId`（number）传入；基础测试预览 JSON 与 `runTest` 组装均带上该字段（运行时以当前 `spaceId.value` 为准）。
4. 更新 JSDoc 与单测断言。

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/test-ontology-function-api.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`（既有无关失败单独注明）
