# Plan：面包屑深色模式文字可读性

确认范围（用户 2026-09-17「确认」）：按 docs/20260917/shijian.md §1。

## 需求理解

本体空间布局中面包屑在深色背景（`--aircas-color-panel-background-deep`）下文字不清；在 `element-plus` 新增可复用 `.aircas-breadcrumb` 覆盖，并接到 `BreadcrumbBar.vue`。

## 修改范围

- 新增 `src/styles/element-plus/el-breadcrumb.scss`
- 修改 `src/styles/index.scss`：目录注释 + `@use`
- 修改 `src/layout/components/BreadcrumbBar.vue`：`el-breadcrumb` 挂 `aircas-breadcrumb`

## 核心实现方式

- 链接项：`--aircas-color-text-secondary`；hover：`--aircas-color-title`
- 当前项（末项）：`--aircas-color-text-primary`
- 分隔符：`--aircas-color-text-muted`
- 选择器仅用 Element Plus 公开 Class；不新增主题变量

## 新增依赖

无。

## 验证方式

- 浏览器：本体空间管理 / 进入空间后面包屑可读
- `npm run check:project-conventions`
- 任务文件 `format:check`
