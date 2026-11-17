# 执行/日志节点按接口返回顺序展示

## 需求理解

执行/日志面板「节点」列表应严格按 `executeInputs.nodes` 接口返回顺序展示，不再按 nodeId 字典序排序。

## 修改范围

- `src/utils/behaviorTreeExecutePlan.ts`：`listBehaviorTreeExecPlanNodeIds` 去掉 `.sort()`
- `tests/behavior-tree-orchestration.test.mjs`：补充保序断言

## 新增、修改和删除文件

- 修改：上述两个文件；新增本 Plan
- 删除：无

## 核心实现方式

`listBehaviorTreeExecuteNodePlans` 已按 `nodes` 数组顺序遍历；`listBehaviorTreeExecPlanNodeIds` 直接返回该顺序，供 `execNodeBlocks` 展示与草稿初始化共用。

## 新增依赖及必要性

无

## 验证方式

- `node --test tests/behavior-tree-orchestration.test.mjs`
- `npm run format:check -- <任务文件>`
