# 外部 API 函数编辑保存

## 需求理解

编辑已有外部 API 函数时，按 `PUT /ontology/function` 保存。请求体与新建保存一致：`functionApi`、`version`、`displayName`、`description`、`type: EXTERNAL`、`ontologySpaceId`、`basedOnOldVersion`、`apiConfig`。无认证不传 `apiKey`。不提交 `language`、`code`、`queryConfig`、`parameters`。

文档示例未列出 `apiConfig`，且将 `language`、`code` 标为必填。按确认方案以新建请求为准。详情接口没有 `apiConfig`，打开编辑时不回填外部 API 配置。

## 修改范围

- 修改参数类型允许可选 `apiConfig` 与 `basedOnOldVersion`。
- 表单编辑不再拦截，校验后仍用 `buildCreateOntologyExternalFunctionParams` 组包。
- 工作区在 `editingOperator` 存在时调用 `updateOntologyFunctionInterface`，成功提示「外部 API 函数已更新」。
- 基础函数与脚本函数的修改请求保持原样。

## 新增、修改和删除文件

- 修改 `src/types/apis/updateOntologyFunctionType.ts`
- 修改 `src/apis/functionApi.ts`（JSDoc）
- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- 修改 `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts`
- 修改 `tests/update-ontology-function-api.test.mjs`
- 修改 `tests/function-operator-workspace.test.mjs`
- 不新增、不删除文件

## 核心实现方式

复用现有 `updateOntologyFunctionInterface`（PUT，body 为 `data`）和创建组包函数。编辑分支传入完整创建参数，不剥离 `basedOnOldVersion` 或 `apiConfig`。

## 新增依赖及必要性

无。

## 验证方式

先改测试确认因编辑拦截而失败，再实现。执行 `tests/update-ontology-function-api.test.mjs`、`tests/function-operator-workspace.test.mjs`，以及 `format:check`、`type-check`、`build:verify`。浏览器登录页会挡住表单，无法点击编辑保存。
