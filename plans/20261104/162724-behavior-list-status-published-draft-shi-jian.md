# 行为列表状态改为已发布/草稿

## 需求理解

列表筛选与展示由启用/失效改为已发布/草稿；接口 status：1→已发布，2→草稿；筛选传 1/2。

## 修改范围

- ontologySpaceBehaviorType.ts
- mapListOntologyActionRecord.ts
- BehaviorListPanel.vue
- tests/ontology-space-behavior.test.mjs
- 视需要 mapOntologyActionInfoToFormState.ts

## 新增、修改和删除文件

- 修改：上述文件
- 新增/删除：无

## 核心实现方式

SpaceBehaviorListStatus 改为 published|draft；映射与文案同步。

## 新增依赖及必要性

无

## 验证方式

相关单测 + 任务文件 format:check
