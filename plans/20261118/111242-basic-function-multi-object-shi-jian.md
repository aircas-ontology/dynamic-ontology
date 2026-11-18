# 基础函数：同目录多选对象

## 需求理解

行为类型为「基础函数」时，在行为类型右侧增加对象多选下拉；多选须属同一分类目录；数据来自 GET `/ontology/category/tree`；保存仍暂不调接口。

## 修改范围

- 新增/扩展分类树对象选项映射（含 categoryId）
- `SpaceBehaviorDraft` 增加 `ontologyIdentifiers`
- `BehaviorFormDialog.vue`：基础函数多选 UI + 同目录约束
- 测试与本 Plan

## 新增、修改和删除文件

- 新增：`src/utils/mapOntologyObjectsToCategoryOptions.ts`（或等价小工具）与约束 helper
- 修改：`ontologySpaceBehaviorType.ts`、`BehaviorFormDialog.vue`、相关测试
- 删除：无

## 核心实现方式

- 遍历分类树时用所属节点 `categoryId` 作为目录键
- 多选变更：以首个已选对象目录为准，跨目录提示并回退
- 保存：未选对象提示「请选择对象」；已选则仍「基础函数保存接口待更新」

## 新增依赖及必要性

无

## 验证方式

相关单测 + format:check
