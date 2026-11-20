# Plan: attribute-metadata-hide-tags

## 需求理解

属性编辑/新增弹窗保留「选择元数据」按钮，去掉已选元数据标签展示（含关闭移除）。取消勾选改在选择弹窗内完成。

## 修改范围

- `AttributePropertyFormDialog.vue`：删除标签 DOM、`selectedMetadataRecords`、`removeSelectedMetadata` 及相关样式与无用 import
- `tests/ontology-object-attribute-panel.test.mjs`：去掉标签/移除相关断言与 `removing a metadata tag…` 测试

## 新增、修改和删除文件

- 修改：上述两个文件
- 新增：本 Plan
- 删除：无

## 核心实现方式

仅去掉表单侧标签展示；草稿 `selectedRecords`、弹窗选择与保存嵌套 JSON 不变。

## 新增依赖及必要性

无。

## 验证方式

更新测试 → 相关测试 → 任务范围 `format:check`。
