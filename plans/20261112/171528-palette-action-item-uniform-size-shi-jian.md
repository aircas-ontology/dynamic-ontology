# 可绑定行为列表项等高排版

## 需求理解

左侧「可绑定行为」列表项因名称换行导致高度不一致；统一为固定两行高度，超长文案单行省略，悬停可看全文。

## 修改范围

- `src/views/BehaviorTreeOrchestration/components/BehaviorTreePalette.vue`

## 新增、修改和删除文件

- 修改：上述 1 个文件
- 新增 / 删除：无

## 核心实现方式

1. `--action` 项固定高度，禁止换行撑高。
2. 标题与 API 各一行 `ellipsis`，并设置 `title` 展示完整文本。
3. flex 子项 `min-width: 0`，避免撑开侧栏。

## 新增依赖及必要性

无。

## 验证方式

- 任务文件 `format:check`
- 目视「可绑定行为」列表项等高、长文案省略
