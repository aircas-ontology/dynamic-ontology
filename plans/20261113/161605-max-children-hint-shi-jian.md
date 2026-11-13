# 界面展示 maxChildren 子节点约束

## 需求理解

按 `kindMeta.maxChildren` 在编排界面展示子节点连接约束：`-1` 可多个、`1` 仅一个、`0` 不可连。

## 修改范围

- `behaviorTreeConstants.ts`：`formatBehaviorTreeMaxChildrenHint`
- `BehaviorTreePalette.vue`：节点种类项展示
- `BehaviorTreeNodeInspector.vue`：选中节点展示（需传入 `kindMeta`）
- `BehaviorTreeOrchestrationDialog.vue`：向 Inspector 传入 `kindMeta`
- `tests/behavior-tree-orchestration.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件；新增本 Plan
- 无删除、无新依赖

## 核心实现方式

1. `formatBehaviorTreeMaxChildrenHint`：`<0` 可多个；`0` 不可连；`1` 仅 1 个；`>1` 最多 N 个。
2. 调色板每项次要文案 + title。
3. Inspector 顶部展示同文案。

## 新增依赖及必要性

无。

## 验证方式

behavior-tree-orchestration 测试；format:check；type-check / build:verify。
