# 行为树箭头可见性修复

## 需求理解

连线箭头仍不可见，需避免被端口遮挡并正确落在连线末端空白处。

## 修改范围

- `useBehaviorTreeGraph.ts`
- 测试断言（如有）

## 核心实现方式

1. 去掉错误正向 `offset`；加大白色 `block` 箭头。
2. `in` 端口缩小并半透明。
3. 目标端 `connectionPoint` 上移，箭头落在子节点上方连线段。

## 新增依赖及必要性

无。

## 验证方式

format:check；behavior-tree-orchestration 测试。
