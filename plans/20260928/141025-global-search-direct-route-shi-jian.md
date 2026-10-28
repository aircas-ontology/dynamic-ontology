# Plan：全局搜索对象/属性直跳

确认范围（用户 2026-09-28「确认」）。

## 需求理解

对象/属性检索结果已含跳转所需字段，点击后直接拼路由，不再调用 `getOntologyMetaByObjectIdInterface`；列表展示 `spaceName`（属性另展示 `ontologyName`）。

## 修改范围

| 操作 | 路径                                                             |
| ---- | ---------------------------------------------------------------- |
| 修改 | `src/types/apis/ontologyGlobalSearchType.ts`                     |
| 修改 | `src/mocks/ontologyGlobalSearchMock/ontologyGlobalSearchMock.ts` |
| 修改 | `src/utils/ontologyGlobalSearchRoute.ts`                         |
| 修改 | `src/composables/ontology/useOntologyGlobalSearch.ts`            |
| 修改 | `OntologyGlobalSearchResultList.vue`                             |
| 修改 | `tests/ontology-global-search.test.mjs`                          |

## 核心实现

- 对象：`uniqueIdentifier` + `spaceId` + `spaceName` + `objectName=name`
- 属性：`uniqueIdentifier` + `spaceId` + `spaceName` + `objectName=ontologyName`
- 点击路径去掉 meta 预请求

## 新增依赖

无。

## 验证方式

相关单测、`format:check`
