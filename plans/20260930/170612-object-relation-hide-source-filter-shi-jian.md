# Plan：对象关系页隐藏源对象筛选（方案 2）

## 需求理解

对象详情关系 Tab 隐藏红框源对象筛选（含重置）；仍调用 `/ontology/category/tree` 供关系表单源/目标下拉。空间关系页不变。

## 修改范围

- `SpaceRelationWorkspace.vue`：对象页隐藏筛选区
- `useSpaceRelationWorkspace.ts`：导出 `isObjectRelationPage`（或等价计算）
- `tests/ontology-space-relation.test.mjs`：断言对象页隐藏筛选、仍保留 category/tree

## 核心实现

- `isObjectRelationPage = Boolean(resolveRelationOntologyUniqueIdentifierFrom(route))`
- 模板 `v-if="!isObjectRelationPage"` 包住筛选下拉与重置
- 继续 `loadRelationObjectOptionsFromObjectTree` + `applyDefaultObjectSourceFilter`

## 新增依赖

无

## 验证

相关单测 + format:check
