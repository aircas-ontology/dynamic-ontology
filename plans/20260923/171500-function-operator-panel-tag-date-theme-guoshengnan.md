# 函数算子列表日期框与标签改用主题色

## 需求理解

函数算子列表页的日期范围触发框仍是浅色默认底，卡片和表格上的状态/类型标签仍是 Element Plus 默认绿灰。只改本页，不改公共主题。

## 修改范围

- 只改 `FunctionOperatorPanel.vue` 的日期范围触发框、卡片/表格 `el-tag`、分页公共 class，以及同页失效的 `--aircas-color-cyan-soft`。
- 不改 `src/styles/`、抽屉、新建弹窗和其他页面。

## 新增、修改和删除文件

- 修改：`src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorPanel.vue`
- 修改：`tests/function-operator-workspace.test.mjs`
- 新增依赖：无

## 核心实现方式

1. 卡片和表格 4 个 `el-tag` 增加 `class="aircas-tag"`。
2. 日期范围用 scoped `:deep(.function-operator-panel__date.el-date-editor)` 覆盖 EP `.el-date-editor.el-input__wrapper` 的白底和内阴影；浮层继续 `popper-class="aircas-picker"`。
3. 分页增加 `class="aircas-pagination"` 和 `popper-class="aircas-pagination-popper"`。
4. 视图切换选中态阴影改为 `--aircas-color-accent-cyan-soft`。

## 验证方式

先补失败测试断言标签 class、日期 `:deep` 选择器和分页 class，再改页面并通过函数算子测试。格式检查仅覆盖上述文件。
