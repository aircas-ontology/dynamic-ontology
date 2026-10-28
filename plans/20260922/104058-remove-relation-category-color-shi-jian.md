# 去除关系分类颜色功能

## 需求理解

去掉关系分类树的分类颜色：新增/编辑弹窗不再设置颜色，树节点不再显示色点；本地数据与类型同步清理。

## 修改范围

- `RelationCategoryFormDialog.vue`、`RelationCategoryPanel.vue`、`SpaceRelationWorkspace.vue`
- `ontologySpaceRelationType.ts`、`relationOperations.ts`、`constants.ts`
- `ontologySpaceRelationMock.ts`
- `tests/ontology-space-relation.test.mjs` 等

## 核心实现方式

1. 表单 `submit` 只提交名称；去掉 color-picker。
2. 树节点去掉色点。
3. 工作区去掉颜色状态与 `category-colors` 传参。
4. payload/节点类型与本地 CRUD、mock 去掉 `color`。
5. 删除无用的 `relationCategoryPredefineColors`。

## 新增依赖及必要性

无。

## 验证方式

- 相关关系测试、`type-check`、任务文件 `format:check`
