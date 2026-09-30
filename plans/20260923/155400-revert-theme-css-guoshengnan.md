# 回退主题 CSS 到 9 月 22 日前提交

## 需求理解

将 `src/styles/theme-dark.css` 和 `src/styles/theme-light.css` 恢复为 `00582e4`（2026-09-22 `rebase文件重构功能缺失问题修复`）之前的版本，即 `56cda95`（2026-09-11 `init project`）中的内容。

## 修改范围

- 只改这两个主题文件。
- 不改页面、组件、Element Plus 覆盖、`public/`、`html/`。
- 不提交，不处理工作区中已有的无关修改。

## 新增、修改和删除文件

- 修改：`src/styles/theme-dark.css`
- 修改：`src/styles/theme-light.css`
- 新增：无
- 删除：无
- 新增依赖：无

## 核心实现方式

用 `git checkout 56cda95 -- src/styles/theme-dark.css src/styles/theme-light.css` 检出该提交中的文件内容。之后按仓库 Prettier 配置只格式化这两个文件。

`56cda95` 之后只有 `00582e4` 改过这两个文件，因此回退结果就是 9 月 22 日提交前的主题令牌。

页面里已经引用的 `00582e4` 新增令牌（如 `--aircas-color-panel-overlay`、`--aircas-color-cyan-soft`）会变成未定义，本次不改这些引用。

## 验证方式

- `npm run format --` 与 `npm run format:check --` 仅覆盖上述两个文件。
- `npm run check:project-conventions`（主题变量变更）。
- `npm run type-check` 与 `npm run build:verify`。
- 不新增单元测试；主题取值回退无法用现有测试合理覆盖。
