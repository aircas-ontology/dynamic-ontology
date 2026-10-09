# 第一步勾选后展示对象卡片

## 需求理解

第一步选择对象：左侧分类树勾选叶子对象后，右侧第一步区域展示选中对象卡片（舰船图标、名称、API 名称）。未勾选时仍显示空状态。不改步骤栏三种状态、不改公共样式、不跨页面引用对象列表私有卡片。

## 修改范围

- 新增 `src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedObject.ts`：选中对象类型与叶子节点映射。
- 修改 `SubspaceCreateTreePanel.vue`：叶子节点补 `apiName`，`getCheckedNodes(true)` 后向父级抛出选中对象。
- 修改 `index.vue`：传递 `selectedObjects`。
- 修改 `SubspaceCreateWorkspacePanel.vue`：有选中则渲染卡片网格，无选中保留 `aircas-empty`。
- 更新 `tests/ontology-subspace-create.test.mjs`。

## 新增依赖

无。

## 验证

TDD 后跑 `ontology-subspace-create` 测试、任务文件 `format:check`、`type-check`、`build:verify`。
