# 子空间属性筛选控件主题色修复

## 需求理解

修复第三步属性筛选条件中的日期范围选择器和数字输入框使用 Element Plus 默认主题色的问题，使暗色、亮色主题均遵循 Aircas 主题变量和交互规范。

## 修改范围

- 修改 `SubspaceCreateWorkspacePanel.vue` 的局部 scoped 样式，覆盖日期范围输入内部的范围文本/分隔符/图标，以及数字输入框和增减按钮。
- 修改 `ontology-subspace-create.test.mjs` 增加主题变量与交互状态回归断言。
- 新增本 Plan 文件；不修改接口、类型、数据流或依赖。

## 核心实现方式

复用现有 `--aircas-color-*` 变量，不新增颜色令牌：输入背景使用 `input-background`，边框和 focus/hover 使用 `border`、`border-highlight`、`focus-border`，文字和图标使用 `text-primary`、`text-muted`、`text-disabled`。通过稳定的 Element Plus 公开类和 scoped `:deep()` 覆盖日期范围输入内部节点及数字控件按钮，并保留控件宽度、溢出和键盘焦点反馈。

## 验证方式

- 先运行定向测试确认新增样式断言失败，再完成实现并确认通过。
- `node --test tests/ontology-subspace-create.test.mjs`
- `npm run format:check --` 任务文件列表
- `npm run type-check`
- `npm run build:verify`
- `git diff --check`
