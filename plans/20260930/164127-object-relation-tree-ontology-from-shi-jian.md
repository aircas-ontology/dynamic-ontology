# Plan：对象页关系树请求携带 ontologyUniqueIdentifierFrom

## 需求理解

对象详情关系 Tab 调用 `GET /ontology/link_category/tree` 时额外传 `ontologyUniqueIdentifierFrom`；空间关系页只传 `spaceId`。

## 修改范围

- `src/types/apis/ontologyRelationCategoryTreeType.ts`
- `src/apis/ontologyManageApi.ts`（JSDoc）
- `src/views/OntologySpaceManagementDetail/utils/resolveRelationRouteContext.ts`
- `src/views/OntologySpaceManagementDetail/composables/useSpaceRelationWorkspace.ts`
- `tests/ontology-relation-category-tree-api.test.mjs`
- `tests/ontology-space-relation.test.mjs`

## 核心实现

- Params 增加可选 `ontologyUniqueIdentifierFrom?: string`
- 解析函数：有 `route.params.objectId` 则返回 trim 值，否则空串
- 加载关系树时对象页展开传入该字段；空间页不传
- 保留 `applyDefaultObjectSourceFilter`

## 新增依赖

无

## 验证

相关单测 + format:check
