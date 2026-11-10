# 函数版本列表接口补充 spaceId

## 需求理解

按 `docs/20261013/1.getFunctionVersionsApi.md`，`GET /ontology/function/versions` query 增加必填 `spaceId`。同步类型、API 注释、调用方与单测。

## 修改范围

- `src/types/apis/getOntologyFunctionVersionsType.ts`
- `src/apis/functionApi.ts`
- `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- `tests/get-ontology-function-versions-api.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. `GetOntologyFunctionVersionsParams` 增加 `spaceId: string`
2. workspace / FormDialog 调用传入当前空间 id
3. 更新 JSDoc 与单测

## 新增依赖

无

## 验证方式

- `node --test --experimental-strip-types tests/get-ontology-function-versions-api.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`
