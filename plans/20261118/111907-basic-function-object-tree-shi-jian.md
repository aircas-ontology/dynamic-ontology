# 基础函数对象下拉展示分类树层级

## 需求理解

「选择对象」由扁平列表改为展示对象分类树目录层级；仍可多选对象，且多选须同一目录。

## 修改范围

- 扩展分类树 → tree-select 节点映射
- `BehaviorFormDialog.vue`：改用 `el-tree-select`（多选、分类不可选、对象可选）
- 保留同目录约束与扁平 `objectOptions`（供约束/其它单选复用）
- 测试与本 Plan

## 核心实现方式

- 分类节点 `id=cat:{categoryId}`，`disabled: true`
- 对象叶子 `id=uniqueIdentifier`，按已选目录动态禁用跨目录项
- `check-strictly` + `show-checkbox` + `multiple`

## 新增依赖及必要性

无

## 验证方式

相关单测 + format:check
