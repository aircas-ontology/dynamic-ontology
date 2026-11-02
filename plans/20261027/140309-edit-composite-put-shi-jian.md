# 编辑函数编排保存改走 PUT

## 需求理解

「编辑函数算子」保存应调用 `docs/20260924/putFunApi-shijian.md` 的 PUT `/ontology/function`；新建仍用 POST。

## 修改范围

- `saveCompositeOperator`：有 `editingOperator` 时 PUT，否则 POST；PUT 剥离 `rateLimitTemplateId` / `basedOnOldVersion`
- `UpdateOntologyFunctionParams` 增加 `compositeConfig`
- 更新 `updateOntologyFunctionInterface` JSDoc 与相关测试

## 新增、修改和删除文件

**修改**

- `src/types/apis/updateOntologyFunctionType.ts`
- `src/apis/functionApi.ts`
- `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts`
- `tests/function-operator-workspace.test.mjs`
- `tests/update-ontology-function-api.test.mjs`

## 核心实现方式

对齐脚本/外部 API：`editingOperator` 分支调用已有 `updateOntologyFunctionInterface`。

## 新增依赖

无。

## 验证方式

- `node --test tests/function-operator-workspace.test.mjs tests/update-ontology-function-api.test.mjs`
- `npm run format:check -- <本任务文件>`
- `npm run type-check`、`npm run build:verify`（关注本任务文件）
