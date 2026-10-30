# 外部 API 参数改为表格

## 需求理解

新建外部 API 函数的输入参数和输出参数改为表格，每条参数占一行。字段、默认值、添加和删除逻辑不变，仍不提交创建接口。

## 修改范围

`FunctionOperatorFormDialog.vue` 中参数展示。

## 新增、修改和删除文件

- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- 修改 `tests/function-operator-workspace.test.mjs`

## 核心实现方式

- 输入表列：name、type、description、location、required、操作。
- 输出表列：name、type、description、操作。
- 单元格内继续使用现有输入框和下拉框。表格上方保留添加按钮。

## 新增依赖及必要性

无。

## 验证方式

- 先补充表格断言并确认失败，再实现后运行 `node --test --experimental-strip-types --test-name-pattern "external api function create form" tests/function-operator-workspace.test.mjs`。
- 对本次文件执行 `format` 与 `format:check`。
- `npm run build:verify`。
