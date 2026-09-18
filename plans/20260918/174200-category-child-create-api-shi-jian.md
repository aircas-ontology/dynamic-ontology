# 新建子分类调用创建接口

## 需求理解

确认新建子分类时调用已有的创建本体分类体系树接口。`name` 为输入的子分类名称，`spaceId` 为当前空间 id，`parentId` 为被点击父节点的 `categoryId`。

## 修改范围

只改子分类弹框的提交。添加分类树仍使用 `parentId: 0`。

## 文件

- 修改 `ConceptHierarchyTree.vue`：按钮把根节点 categoryId 传出。
- 修改 `CategoryTreeChildDialog.vue`：确认交给父组件提交。
- 修改 `ObjectWorkspacePanel.vue`：提交创建接口并刷新树。
- 修改 `tests/ontology-object-workspace.test.mjs`。

## 新增依赖

无。
