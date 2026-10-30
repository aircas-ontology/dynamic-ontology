# 对象与关系层级树：仅展开有子分类的节点

## 需求理解

对象、关系分类层级树默认展开改为：有子分类的分类展开；分类下只有对象/关系内容时保持收起。

## 修改范围

- 修改：`src/views/ObjectWorkspacePanel/components/ConceptHierarchyTree.vue`
- 修改：`src/views/SpaceRelationWorkspace/components/RelationCategoryPanel.vue`
- 无新增依赖

## 核心实现方式

将收集全部分类 id 改为仅收集 `children` 中存在子分类的分类 id，并递归处理。

## 新增依赖及必要性

无。

## 验证方式

- 人工核对对象树与关系树默认展开
- `npm run format:check --` 上述两个文件
- `npm run type-check`（区分既有失败）
