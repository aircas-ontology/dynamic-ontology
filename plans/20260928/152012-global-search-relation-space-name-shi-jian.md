# Plan：关系分组列表展示 spaceName

确认范围（用户 2026-09-28「确认」）。

## 需求理解

`type === "关系分组"` 时列表展示 `spaceName`；跳转路由不变。

## 修改范围

| 操作 | 路径                                    |
| ---- | --------------------------------------- |
| 修改 | `OntologyGlobalSearchResultList.vue`    |
| 修改 | `ontologyGlobalSearchMock`              |
| 修改 | `tests/ontology-global-search.test.mjs` |

## 核心实现

对象与关系分组共用「空间：spaceName」展示；Mock 补 `spaceId`/`spaceName`。

## 新增依赖

无。

## 验证方式

相关单测、`format:check`
