# 编排源函数列表改传 type=COMPOSITE

## 需求理解

新建函数编排时「源函数」下拉请求需传 `type=COMPOSITE`，去掉 `excludeTypes=BASIC_QUERY`。

## 修改范围

- `FunctionOperatorFormDialog.vue` 的 `loadSourceFunctionOptions`
- 相关测试断言

## 新增、修改和删除文件

**修改**

- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- `tests/function-operator-workspace.test.mjs`

## 核心实现方式

统一按 `mapFunctionOperatorTypeToApi(form.type)` 传 `type`。

## 新增依赖

无。

## 验证方式

相关测试、`format:check`。
