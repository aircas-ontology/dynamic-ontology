# 关闭脚本 IDE 时关闭上层表单

## 需求理解

右上角关闭脚本 Web-IDE 时一并关闭上层表单。「返回上一步」只关 IDE，保留上层表单。

## 修改范围

- `FunctionOperatorScriptIdeDialog.vue`：返回上一步改为 emit `back`。
- `FunctionOperatorFormDialog.vue`：`update:modelValue` 为 false 时关表单；`back` 时只关 IDE。
- 更新相关契约测试。

## 新增、修改和删除文件

- 修改上述表单、IDE 与测试
- 新增 `tests/script-ide-close-form.test.mjs`
- 新增本 Plan

## 核心实现方式

区分关闭入口：对话框关闭走 `onScriptIdeVisibleChange` 并关上层；`onScriptIdeBack` 仅 `scriptIdeVisible = false`。

## 新增依赖及必要性

无。

## 验证方式

先改测试再实现。执行相关 node 测试与 format:check；type-check / build:verify 按应用代码变更执行。
