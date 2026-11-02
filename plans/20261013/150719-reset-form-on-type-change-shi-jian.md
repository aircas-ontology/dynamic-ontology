# 切换函数类型重置表单

## 需求理解

切换新建弹窗函数类型时重置为空草稿，避免上一类型 name/functionApi 等残留。

## 修改范围

FunctionOperatorFormDialog.vue 与契约测试。

## 新增、修改和删除文件

- 修改：FunctionOperatorFormDialog.vue、tests/function-operator-workspace.test.mjs

## 核心实现方式

changeType 同类型短路；否则 createEmptyDraft + 设 type/definition，Object.assign，清校验并重拉源函数列表。

## 新增依赖及必要性

无。

## 验证方式

TDD；node --test tests/function-operator-workspace.test.mjs；format:check。
