# 分类叶子节点使用文件夹图标

## 需求理解

概念层级树、关系分类树、属性分类树中，分类节点无论是否还有子节点，都使用文件夹图标。对象、关系和属性叶子仍用圆点。

## 修改范围

- `ConceptHierarchyTree.vue`
- `RelationCategoryPanel.vue`
- `AttributeCategoryTree.vue`
- `tests/ontology-relation-category-tree-api.test.mjs`

## 核心实现方式

分类节点固定渲染 `FolderOpened`，去掉叶子分类的 `CollectionTag`。

## 新增依赖

无。

## 验证

更新关系分类树断言后实现，再跑相关测试、任务文件 `format:check`、`type-check`、`build:verify`。
