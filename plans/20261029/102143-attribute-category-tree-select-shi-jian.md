# 属性分类改为树形选择

## 需求理解

新建/编辑对象属性时，「属性分类」下拉展示分类目录树（仅目录），替代扁平列表。

## 修改范围

- `attributePanelHelpers.ts`：新增仅目录树映射
- `useAttributePropertyList.ts`：categoryOptions 改用树映射
- `AttributePropertyFormDialog.vue`：el-tree-select
- 相关测试

## 新增、修改和删除文件

- 修改上述文件；无新增依赖

## 核心实现方式

`mapAttributeCategoryTreeSelectData` 过滤属性叶子；表单用 `el-tree-select` + `check-strictly`。

## 新增依赖及必要性

无。

## 验证方式

- ontology-object-attribute-panel 测试
- format:check
