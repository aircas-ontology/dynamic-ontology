# Plan：属性跳转改用 ontologyUniqueIdentifier

确认范围（用户 2026-09-28「确认」）。

## 需求理解

属性类型路径参数改为 `{ontologyUniqueIdentifier}`；对象类型仍用 `uniqueIdentifier`。

## 修改范围

| 操作 | 路径                                    |
| ---- | --------------------------------------- |
| 修改 | `ontologyGlobalSearchType.ts`           |
| 修改 | `ontologyGlobalSearchRoute.ts`          |
| 修改 | `ontologyGlobalSearchMock`              |
| 修改 | `tests/ontology-global-search.test.mjs` |

## 核心实现

`resolveOntologyGlobalSearchPropertyRoute` 使用 `item.ontologyUniqueIdentifier`。

## 新增依赖

无。

## 验证方式

相关单测、`format:check`
