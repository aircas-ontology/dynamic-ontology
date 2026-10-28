# Plan：整理 el-pagination.scss 嵌套结构

确认依据：用户要求按 el-button 同类问题修复。

## 需求理解

- `.aircas-pagination` 仅作组件根覆盖；`.el-select__wrapper` 等移入 `&.el-pagination`
- `.aircas-pagination-popper` 因挂 body 保留独立根，改为 `&.el-popper` 写法

## 修改范围

- `src/styles/element-plus/el-pagination.scss`

## 新增依赖

无。

## 验证方式

空间列表分页与每页条数下拉样式仍正常。
