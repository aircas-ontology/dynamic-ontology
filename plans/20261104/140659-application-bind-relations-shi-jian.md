# 应用行为绑定关系多选表

## 需求理解

在应用行为入/出参下方增加「绑定关系」表：本空间关系列表，多选；展示关系名称与源→目标。本轮不组装 createAction。

## 修改范围

- BehaviorFormDialog.vue
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 修改：上述 2 个
- 新增/删除：无

## 核心实现方式

1. 复用 loadRelationRows / relationRows
2. applicationSelectedRelationIds 多选
3. 进入应用行为时加载关系列表

## 新增依赖及必要性

无

## 验证方式

相关单测 + 任务文件 format:check
