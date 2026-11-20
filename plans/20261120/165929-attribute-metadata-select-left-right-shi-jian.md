# Plan: attribute-metadata-select-left-right

## 需求理解

选择元数据弹窗改为左右分栏：

- 左侧为元数据目录树；仅叶子节点可勾选，有子节点的目录节点不可勾选。
- 右侧展示已勾选叶子节点的 key:value 列表；value 按类型可编辑（输入 / 枚举多选 / 范围）。
- 去掉树节点上的行内值编辑与行号。
- 确认时仍用勾选叶子 + 右侧值草稿组装 selectedRecords，保持现有 form 回写契约。

## 修改范围

- `src/views/OntologyObjectAttributePanel/components/AttributeMetadataSelectDialog.vue`
- `tests/ontology-object-attribute-panel.test.mjs`

## 新增、修改和删除文件

- 修改：上述两个文件
- 新增：本 Plan 文件
- 删除：无

## 核心实现方式

1. 弹窗内容改为左树右列表布局。
2. 树数据映射时为有 children 的节点设置 disabled，配合 show-checkbox + check-strictly，仅叶子可勾选。
3. 监听 check-change，同步 checkedIds；右侧列表按勾选叶子展示 name + 类型对应值编辑器。
4. 移除 rowNumberById 与树内值编辑 UI。
5. confirm 继续调用 buildSelectedAttributeMetadataRecords。

## 新增依赖及必要性

无。

## 验证方式

1. TDD：先更新测试断言（左右栏、目录禁用、无行号/树内输入），确认失败。
2. 实现后 `npm test -- tests/ontology-object-attribute-panel.test.mjs`（或项目等价入口）。
3. 任务范围 `npm run format:check -- <修改文件>`。
4. 如涉及类型/构建相关变更再跑 type-check / build:verify。
