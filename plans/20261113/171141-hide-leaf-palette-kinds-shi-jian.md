# 去掉调色板三个叶子节点

## 需求理解

左侧「节点种类」不再展示本地叶子节点；kind 定义与可绑定行为保留。

## 修改范围

- `BehaviorTreePalette.vue`
- `tests/behavior-tree-orchestration.test.mjs`

## 新增、修改和删除文件

- 修改：上述 2 个文件；新增本 Plan
- 无删除、无新依赖

## 核心实现方式

`groupedKinds` 仅保留 COMPOSITE、DECORATOR。

## 新增依赖及必要性

无。

## 验证方式

format:check；behavior-tree-orchestration 测试。
