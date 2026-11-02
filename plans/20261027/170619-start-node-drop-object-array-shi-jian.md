# 开始节点去掉对象与数组类型

## 需求理解

函数编排开始节点入参类型仅保留数字、字符串、布尔；去除对象、数组。

## 修改范围

- Endpoint 弹框：开始节点三选类型；结束节点仍五类
- 新建开始节点默认参数类型改为 string
- 相关测试断言

## 新增、修改和删除文件

**修改**

- `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeEndpointNodeDialog.vue`
- `src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts`
- `tests/function-operator-workspace.test.mjs`（若有相关断言）

## 核心实现方式

按 `localKind` 区分类型选项；hydrate 时若开始节点旧数据为 object/array，回落为 string。

## 新增依赖

无。

## 验证方式

- 相关测试、`format:check`、`build:verify`
