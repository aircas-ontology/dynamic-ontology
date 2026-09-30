# 概念层级树本体对象按树节点样式展示

## 需求理解

概念层级树中分类节点下的本体对象名称不再以辅助文字形式展示，改为与树叶节点一致的图标、缩进与交互样式，方便区分类别与对象。

## 修改范围

- 修改 `ConceptHierarchyTree.vue` 的对象名称展示结构和组件私有样式。
- 更新概念层级树展示测试，覆盖对象树叶节点的图标和样式类。

## 新增、修改和删除文件

- 修改 `src/views/OntologySpaceManagementDetail/components/ConceptHierarchyTree.vue`。
- 修改 `tests/ontology-object-create-dialog.test.mjs`。
- 新增本 Plan 文件。

## 核心实现方式

在每个分类节点的本体对象名称前使用现有 `CollectionTag` 图标，按树叶节点行展示；复用当前主题文字、悬停和焦点变量，保持名称溢出截断。对象展示仅为分类内容，不改变分类节点的选中、定位和分类操作。

## 新增依赖及必要性

无。

## 验证方式

- 先运行概念层级树展示测试确认新增断言失败。
- 完成最小实现后运行相关测试。
- 对任务文件执行 Prettier 格式化和格式检查。
- 执行 `npm run type-check`、`npm run build:verify` 和 `git diff --check`。
