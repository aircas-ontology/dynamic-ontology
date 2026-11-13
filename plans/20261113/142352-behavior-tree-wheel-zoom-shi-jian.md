# 编排画布滚轮缩放

## 需求理解

行为树编排画布通过鼠标滚轮直接缩放。

## 修改范围

- `useBehaviorTreeGraph.ts`
- 测试断言

## 核心实现方式

`mousewheel.enabled: true`，去掉 `ctrl`/`meta` 修饰键限制；保留缩放上下限。

## 新增依赖及必要性

无。

## 验证方式

format:check；behavior-tree-orchestration 测试。
