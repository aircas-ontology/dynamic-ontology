# 对象筛选改为源本体前端过滤

## 需求理解

选择筛选对象后，在当前关系中过滤「源本体 === 选中对象」；表格与三维图同步；不再用跳数裁剪。

## 修改范围

- `spaceRelationGraph.ts`
- `useSpaceRelationWorkspace.ts`
- `SpaceRelationWorkspace.vue`
- `tests/ontology-space-relation.test.mjs`

## 核心实现方式

1. 新增 `filterRelationsBySourceObject`，按源匹配 value 与对应 label。
2. `visibleSpaceRelations` 改用源过滤；图种子传展示名。
3. 筛选提示文案改为源对象。

## 新增依赖及必要性

无。

## 验证方式

- 相关关系测试、`format:check`
