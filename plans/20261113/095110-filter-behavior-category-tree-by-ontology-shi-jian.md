# 对象行为页分类树按 ontologyUniqIdentifier 过滤

## 需求理解

对象行为页左侧分类树的行为叶子应对齐右侧列表，按路由中的对象唯一标识过滤；空间级入口不过滤。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/utils/mapActionCategoryTree.ts`
- `src/views/SpaceBehaviorWorkspace/composables/useSpaceBehaviorWorkspace.ts`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件
- 新增 / 删除：无

## 核心实现方式

1. `mapActionCategoryTree` / `mapActionCategoryNode` 支持可选 `ontologyUniqIdentifier`；有值时仅保留匹配的 `actionInfos` 叶子并重算 count。
2. `loadActionCategoryTree` 在存在 `ontologyId` 时传入过滤条件。
3. 补充单测覆盖匹配、不匹配与不过滤场景。

## 新增依赖及必要性

无。

## 验证方式

- `tests/ontology-space-behavior.test.mjs` 相关断言通过
- 任务文件 `format:check`
