# 行为树画布边路由改为 manhattan

## 需求理解

将行为树编排画布连线 router 从 `orth` 改为 `manhattan`，便于对比折线/避障效果。

## 修改范围

- `src/views/BehaviorTreeOrchestration/composables/useBehaviorTreeGraph.ts` 中 `BEHAVIOR_TREE_EDGE_ROUTER`

## 新增、修改和删除文件

- 修改：`useBehaviorTreeGraph.ts`
- 无新增/删除

## 核心实现方式

`name: "manhattan"`，保留 `args.padding: 18`（与调度规则画布一致）；`createEdge` / `addEdge` / `setRouter` 复用该常量。

## 新增依赖及必要性

无。

## 验证方式

打开行为树编排弹框，观察父子连线折线与避障；`format:check` 针对该文件。
