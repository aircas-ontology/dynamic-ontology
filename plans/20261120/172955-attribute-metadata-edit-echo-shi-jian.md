# Plan: attribute-metadata-edit-echo

## 需求理解

编辑属性打开「选择元数据」时，根据已保存嵌套 `metadata` 回显右侧 key:value，并勾选左侧叶子。按名称路径遍历目录树匹配末端节点，叶值按输入字符串 / 枚举 `,` 拆分 / 范围 `min,max` 还原。同级重名多命中时取尚未占用的第一个叶子。

## 修改范围

- `attributeMetadataSelection.ts`：`parseAttributeMetadataNestedSelection`、`resolveAttributeMetadataSelectionEcho`
- `AttributeMetadataSelectDialog.vue`：加载后用回显结果设勾选与值草稿
- `AttributePropertyFormDialog.vue`：传入完整 `draft.metadata`
- `tests/ontology-object-attribute-panel.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. 从 nested 收集路径→叶值；对照 catalog 祖先名称路径匹配叶子。
2. `resolveAttributeMetadataSelectionEcho`：优先 `selectedRecords`，否则解析 nested。
3. 弹窗 `loadMetadataCatalog` 用回显结果初始化 `checkedIds` / `valueDrafts` 并 `setCheckedKeys`。

## 新增依赖及必要性

无。

## 验证方式

TDD → 相关测试 → 任务范围 `format:check`。
