# Plan: 新建函数弹框增加函数版本

## 需求理解

基础函数新建/编辑弹框中，在「函数说明」上方增加「函数版本」表单项。

## 修改范围

- `FunctionOperatorFormDialog.vue`：表单项 + 必填校验 + 提交 trim
- `tests/function-operator-workspace.test.mjs`：断言字段位置

不改创建/更新 API 契约（当前无 version）。

## 新增依赖

无。

## 验证方式

定向测试 + format。
