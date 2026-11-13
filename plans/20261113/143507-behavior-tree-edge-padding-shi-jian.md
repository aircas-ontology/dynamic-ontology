# 行为树连线离开节点边框

## 需求理解

正交关系线横段紧贴父节点底边，需拉开间距。

## 修改范围

- `useBehaviorTreeGraph.ts`
- 测试断言

## 核心实现方式

1. 源端 `connectionPoint` 下移约 18px。
2. `orth` 路由 `padding: 18`。
3. 同步已有边时一并更新 router。

## 新增依赖及必要性

无。

## 验证方式

format:check；behavior-tree-orchestration 测试。
