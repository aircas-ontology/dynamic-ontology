# Plan：函数列表必传 ontologySpaceId

确认范围（用户 2026-09-24「确认」）。

## 需求理解

`GET /ontology/function/list` 的 `ontologySpaceId` 必填，值为当前空间 id。

## 修改范围

- `getOntologyFunctionListType.ts`、`functionApi.ts`、`useFunctionOperatorWorkspace.loadOperators`、相关单测

## 新增依赖

无。

## 验证方式

相关单测 + format。
