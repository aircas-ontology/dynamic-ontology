# 画布工具移至顶栏

## 需求理解

将行为树编排左侧「画布工具」（自动布局 / 适应画布 / 导入导出）移到顶栏右侧，排在「清空」「保存」左侧；左侧面板仅保留节点种类与可绑定行为。

## 修改范围

- `src/views/BehaviorTreeOrchestration/components/BehaviorTreePalette.vue`
- `src/views/BehaviorTreeOrchestration/BehaviorTreeOrchestrationDialog.vue`

## 新增、修改和删除文件

- 修改：上述 2 个文件
- 新增 / 删除：无

## 核心实现方式

1. 从 Palette 删除「画布工具」区块及相关 `layout` / `fit` / `focus-json` emit 与样式。
2. 在 Dialog 顶栏 `__actions` 中按顺序放置：自动布局、适应画布、导入/导出、清空、保存；交互仍分别调用 `layoutBehaviorTree`、`fitBehaviorTreeView`、切换 JSON Tab。

## 新增依赖及必要性

无。

## 验证方式

- 任务文件 `format:check`
- `tests/behavior-tree-orchestration.test.mjs` 通过
- 目视顶栏按钮顺序与左侧无画布工具区块
