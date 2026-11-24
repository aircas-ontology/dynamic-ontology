# Plan：修复选择实例表格高度塌缩

## 需求理解

创建主题「选择实例」中，部分有实例数据的对象表格高度未撑开，需恢复可见行。

## 修改范围

仅 `SubspaceCreateInstancePanel.vue` 的表格高度策略与分组样式；同步相关测试断言。不改数据加载逻辑。

## 新增、修改和删除文件

- 修改：`src/views/OntologySubspaceCreate/components/SubspaceCreateInstancePanel.vue`
- 修改：`tests/ontology-subspace-create.test.mjs`
- 新增/删除：无

## 核心实现方式

1. 有数据分组改为内容自适应（`flex: 0 0 auto` + 合理 `min-height`），避免在 `overflow: auto` 下被压成 0。
2. 表格去掉 `height="100%"`，改用 `max-height`，按内容撑开并可滚动。
3. 空态分组仍用现有 `is-compact`。

## 新增依赖及必要性

无。

## 验证方式

- 更新并跑 `ontology-subspace-create` 相关测试
- `format:check` 任务文件
- 人工确认多对象混合有/无实例时表格可见
