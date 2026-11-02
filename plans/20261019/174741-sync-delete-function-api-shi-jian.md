# 同步函数删除接口

## 需求理解

`docs/20260924/deleteFunApi-shijian.md` 将删除接口改为 `DELETE /ontology/function/delete`，请求体包含必填 `functionApi` 与 `version`。不再把 `functionApi` 放在路径中。

## 修改范围

- 删除参数类型增加 `version`。
- 删除请求 URL 去掉路径段，使用 `data` 提交 JSON。
- 列表删除确认时传入当前算子版本；缺少版本时不请求并提示。

## 新增、修改和删除文件

- 修改 `src/types/apis/deleteOntologyFunctionType.ts`
- 修改 `src/apis/functionApi.ts`
- 修改 `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts`
- 修改 `tests/delete-ontology-function-api.test.mjs`

不新增、不删除文件。Mock 响应样例不变。

## 核心实现方式

与行为分类删除的 URL 形式不同：契约要求把 `functionApi` 与 `version` 放在 DELETE 的 query 中，不放请求体。

## 新增依赖及必要性

无。

## 验证方式

先更新断言并确认失败，再实现。执行 `tests/delete-ontology-function-api.test.mjs`、`npm run type-check`、`npm run build:verify`，以及对本次文件的 `npm run format:check`。
