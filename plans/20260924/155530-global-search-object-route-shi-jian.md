# Plan：全局检索「对象」跳转对象详情

确认范围（用户 2026-09-24「确认」）。

## 需求理解

`type === "对象"` 跳转到 `/workspace/ontology-object/{uniqueIdentifier}/object?spaceId&spaceName&objectName`；先用 `objectId` 调 meta 接口取 uniqueIdentifier / 名称后再跳转（与「属性」一致）。

## 修改范围

- `ontologyGlobalSearchRoute.ts`：新增对象路由解析；同步路由不再处理「对象」
- `useOntologyGlobalSearch.ts`：对象点击先拉 meta
- `tests/ontology-global-search.test.mjs`

## 新增依赖

无。

## 验证方式

相关单测 + format + type-check/build:verify（任务范围）。
