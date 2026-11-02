# 结束节点去掉对象与数组类型

## 需求理解

结束节点出参类型下拉去掉「对象」「数组」，与开始节点一致，仅保留数字、字符串、布尔。

## 修改范围

- Endpoint 弹框结束节点类型选项与 hydrate/confirm 规范化
- 新建结束节点默认参数类型
- 相关测试断言

## 新增、修改和删除文件

**修改**

- `FunctionOperatorCompositeEndpointNodeDialog.vue`
- `useCompositeWorkflowCanvas.ts`
- `tests/function-operator-workspace.test.mjs`

## 核心实现方式

结束节点三选类型；打开/确认时非标量回落为 string；新建结束节点默认 type 为 string。

## 新增依赖

无。

## 验证方式

相关测试、`format:check`、`build:verify`。
