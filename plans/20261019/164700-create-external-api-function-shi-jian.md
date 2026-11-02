# 新建外部 API 函数创建

## 需求理解

按 `docs/20260923/6.createFunApi-shijian.md` 的 `POST /ontology/function`，用新建外部 API 表单提交创建请求。请求体对齐 `docs/20261019/shijian.md` 样例，并补充确认项：认证 Header 对应 `apiConfig.apiKey`。

仅新建。编辑已有外部 API 不调用修改接口，提示「外部 API 函数编辑本阶段暂未开放」。配置测试仍不调用测试接口。基础函数与脚本函数保存路径不变。

## 修改范围

- 创建参数类型增加 `EXTERNAL` 与可选 `apiConfig`。
- 表单保存时组装并提交创建请求。
- 认证方式为 API Key 时提交修剪后的 `apiKey`；无认证时不提交该字段。`contentType` 固定 `application/json`。
- 输入 `required` 转为布尔值，`location` 转为小写 `body` / `path` / `query` / `header`。名称为空的参数行不提交。
- 接口地址必填；API Key 模式下认证 Header 必填。
- 选择源版本时 `basedOnOldVersion` 为 `true`。不传 `queryConfig`、`parameters` 和配置测试 JSON。

## 新增、修改和删除文件

- 修改 `src/types/apis/createOntologyFunctionType.ts`
- 修改 `src/types/index.ts`
- 修改 `src/apis/functionApi.ts`（创建函数说明覆盖 EXTERNAL）
- 新增 `src/views/FunctionOperatorPanel/utils/buildCreateOntologyExternalFunctionParams.ts`
- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- 修改 `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts`
- 修改 `src/views/FunctionOperatorPanel/index.vue`
- 修改 `tests/create-ontology-function-api.test.mjs`
- 修改 `tests/function-operator-workspace.test.mjs`
- 新增 `tests/build-create-ontology-external-function-params.test.mjs`

不删除文件。

## 核心实现方式

复用 `createOntologyFunctionInterface`。页面工具函数把表单状态组装为 `CreateOntologyFunctionParams`。工作区新增仅创建的保存函数，成功后关闭弹框并刷新列表。

## 新增依赖及必要性

无。

## 验证方式

先更新组装与类型断言并确认失败，再实现。执行对应 `node --test`、`npm run type-check`、`npm run build:verify`、`npm run check:types-conventions`，以及对本次文件的 `npm run format:check`。`npm test` 与 `npm run test:coverage` 按仓库要求执行，并单独记录既有失败。
