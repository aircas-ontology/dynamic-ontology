# 外部 API 配置测试表单

## 需求理解

在新建外部 API 函数的输入、输出参数表格下增加配置测试区域。左侧可编辑测试内容，右侧展示结果占位，状态为尚未测试。运行测试不调用接口。

## 修改范围

`FunctionOperatorFormDialog.vue` 外部 API 区块。

## 新增、修改和删除文件

- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- 修改 `tests/function-operator-workspace.test.mjs`

## 核心实现方式

- 标题「配置测试」，右侧「尚未测试」。
- 左侧文本框默认 `{\n  "": ""\n}`，右侧只读「测试结果将在这里显示」。
- 「运行测试」提示「配置测试本阶段暂未开放」，不请求测试接口。
- 切换函数类型或关闭弹框时恢复默认文本。

## 新增依赖及必要性

无。

## 验证方式

- 先补充断言并确认失败，再实现后运行 `node --test --experimental-strip-types --test-name-pattern "external api function create form" tests/function-operator-workspace.test.mjs`。
- 对本次文件执行 `format` 与 `format:check`。
- `npm run build:verify`。
