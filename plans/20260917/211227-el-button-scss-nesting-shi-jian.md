# Plan：整理 el-button.scss 嵌套结构

确认范围（用户 2026-09-17「确认」）。

## 需求理解

仅最外层 `.aircas-button`；内部统一挂在 `&.el-button`；保留原有 `el-*` / 状态覆盖；去掉独立顶层 `.aircas-button--edit`。

## 修改范围

- `src/styles/element-plus/el-button.scss`

## 新增依赖

无。

## 验证方式

目视确认按钮 type / edit / disabled 样式仍生效。
