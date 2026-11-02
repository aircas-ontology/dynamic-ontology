# 编排基于源函数传 basedOnOldVersion

## 需求理解

函数编排基于源函数创建时，创建请求需传 `basedOnOldVersion=true`，与脚本函数一致。

## 修改范围

- `FunctionOperatorFormDialog.vue` 的 `emitSaveComposite`
- 相关测试断言

## 新增、修改和删除文件

**修改**

- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- `tests/function-operator-workspace.test.mjs`

## 核心实现方式

新建且 `sourceVersion` 非空时设置 `basedOnOldVersion: true`，否则删除该字段。

## 新增依赖

无。

## 验证方式

相关测试、`format:check`。
