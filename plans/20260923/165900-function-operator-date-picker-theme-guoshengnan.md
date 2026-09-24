# 函数算子时间选择框改用主题色

## 需求理解

本体空间函数算子页筛选栏的日期范围选择框颜色不符合主题。改为使用已有日期浮层覆盖，并给本页触发框补主题色。

## 修改范围

- 只改 `FunctionOperatorPanel.vue` 中的 `el-date-picker` 及其局部样式。
- 不改 `src/styles/`、其他页面的日期选择器和业务逻辑。

## 新增、修改和删除文件

- 修改：`src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorPanel.vue`
- 修改：`tests/function-operator-workspace.test.mjs`
- 新增依赖：无

## 核心实现方式

选择器增加 `class="aircas-input function-operator-panel__date"` 和 `popper-class="aircas-picker"`。范围触发框用页面 scoped 样式套输入底、边框、文字和 hover / 展开态，因为公共 `aircas-input` 只覆盖 `el-input` / `el-textarea`。

## 验证方式

先补失败测试断言公共 popper class 与局部触发框主题变量，再改页面并通过函数算子测试。格式检查仅覆盖上述文件。
