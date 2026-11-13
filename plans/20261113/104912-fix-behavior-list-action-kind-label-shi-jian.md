# 行为列表行为类别按 actionKind 映射展示

## 需求理解

列表「行为类别」按文档映射展示：`BASE→基础行为`、`APPLICATION→应用行为`、`TREE→行为树`；不再拼接行为类型后缀。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorListPanel.vue`
- `src/views/SpaceBehaviorWorkspace/utils/mapListOntologyActionRecord.ts`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件
- 新增 / 删除：无

## 核心实现方式

1. `formatBehaviorCategoryLabel` 仅返回 `SPACE_BEHAVIOR_KIND_LABELS[item.kind]`。
2. `mapActionKindToSpaceBehaviorKind` 增加 `TREE → behaviorTree`。
3. 更新列表展示与 TREE 映射相关单测。

## 新增依赖及必要性

无。

## 验证方式

- `tests/ontology-space-behavior.test.mjs` 相关断言通过
- 任务文件 `format:check`
