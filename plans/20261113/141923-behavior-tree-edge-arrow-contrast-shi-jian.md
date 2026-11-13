# 行为树连线箭头增强可见性

## 需求理解

箭头已存在但不明显，需加大尺寸并提高对比度。

## 修改范围

- `useBehaviorTreeGraph.ts` 边样式常量

## 核心实现方式

加粗连线；`block` 箭头加大（约 14×10）；高对比填充 `#e8eef7`；`offset: 6` 离开端口。

## 新增依赖及必要性

无。

## 验证方式

format:check；behavior-tree-orchestration 相关断言。
