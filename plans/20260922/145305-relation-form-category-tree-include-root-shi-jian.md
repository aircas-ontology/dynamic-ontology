# 关系表单分类树含根节点

## 需求理解

添加/编辑关系弹窗的「分类」下拉应展示与左侧一致的完整分类树，包含根节点。

## 修改范围

- `src/views/OntologySpaceManagementDetail/composables/useSpaceRelationWorkspace.ts`
- `src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationFormDialog.vue`
- `tests/ontology-space-relation.test.mjs`

## 新增、修改和删除文件

- 修改：上述三个文件
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. `relationCategoryOptions` 改为返回完整 `relationCategoryTree`，不再取根的 `children`。
2. 表单创建预填仍按「default 是否在选项树中」；根入选项后可选中并预填根。
3. 创建接口对 mock 根常量 `relation-all` 的省略逻辑不变；真实数字根 id 照常提交。
4. 分类字段仍可选（可清空）。

## 新增依赖及必要性

无。

## 验证方式

- 相关关系测试
- `npm run type-check`
- 任务文件 `format:check`
