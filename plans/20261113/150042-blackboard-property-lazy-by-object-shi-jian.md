# 黑板属性改为按对象懒加载

## 需求理解

进入行为编排后不再对空间内每个对象并行请求 `GET /ontology/property/info`。只拉对象列表；用户在黑板「对象属性」中选中对象后再请求该对象属性。

## 修改范围

- `src/views/BehaviorTreeOrchestration/composables/useBehaviorTreeOrchestration.ts`
- `src/views/BehaviorTreeOrchestration/components/BehaviorTreeBlackboardPanel.vue`
- `src/views/BehaviorTreeOrchestration/BehaviorTreeOrchestrationDialog.vue`
- `tests/behavior-tree-orchestration.test.mjs`

## 新增、修改和删除文件

- 修改：上述 4 个文件
- 新增：本 Plan
- 无删除、无新依赖

## 核心实现方式

1. 进页 / 切空间：只拉 category tree → objectOptions；清空 objectProperties 与已加载缓存；不再全量 property/info。
2. 新增 `ensureBehaviorTreeObjectProperties(objectId)`：按对象缓存、进行中去重、合并进 objectProperties。
3. 黑板面板选中对象时 emit `request-object-properties`；Dialog 接线；对象/属性 loading 分拆。
4. 编辑回显：无对象 id 时保持 orphan 兜底，不恢复全量预拉。

## 新增依赖及必要性

无。

## 验证方式

- TDD 更新 `tests/behavior-tree-orchestration.test.mjs` 后跑通
- format:check（改动文件）
- type-check / build:verify
