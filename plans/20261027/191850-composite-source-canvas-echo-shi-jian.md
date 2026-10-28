# 源版本创建编排画布回显

## 需求理解

基于源版本新建函数编排时，将详情中的 compositeConfig 回填表单，下一步画布可回显流程。

## 修改范围

- `FunctionOperatorFormDialog.vue` 的 `applySourceTemplateDraft` 与源模板清空路径
- 相关测试断言

## 新增、修改和删除文件

**修改**

- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- `tests/function-operator-workspace.test.mjs`

## 核心实现方式

`applySourceTemplateDraft` 写入/清除 `form.compositeConfig`；清空源版本或重置模板选择时同步删除。

## 新增依赖

无。

## 验证方式

相关测试、`format:check`。
