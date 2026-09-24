# 函数算子抽屉描述表改用主题色

## 需求理解

详情抽屉里描述表的标签格仍是白底。公共 `aircas-descriptions` 选择器对不上当前 Element Plus 单元格 class。只在抽屉局部覆盖，不改公共样式。

## 修改范围

- 只改 `FunctionOperatorDetailDrawer.vue` 的描述表。
- 不改 `src/styles/`、表格、标签和其他页面。

## 新增、修改和删除文件

- 修改：`src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorDetailDrawer.vue`
- 修改：`tests/function-operator-workspace.test.mjs`
- 新增依赖：无

## 核心实现方式

描述表增加 `function-operator-detail__meta`。用官方 `--el-descriptions-*` 变量和 scoped `:deep(.el-descriptions__label.is-bordered-label)`、`:deep(.el-descriptions__content.is-bordered-content)` 套主题底色、文字和边框。

## 验证方式

先补失败测试断言局部描述表主题变量，再改页面并通过函数算子测试。格式检查仅覆盖上述文件。
