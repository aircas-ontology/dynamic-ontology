# 开始节点默认参数名改为 input

## 需求理解

新建开始节点时，默认入参名称由 `output` 改为 `input`（id 同步为 `input`）。

## 修改范围

- 画布新建开始节点默认 `outputParameters`
- 相关源码断言

## 新增、修改和删除文件

**修改**

- `src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts`
- `tests/function-operator-workspace.test.mjs`

## 核心实现方式

仅改新建开始节点的默认一条参数 id/name 为 `input`。

## 新增依赖

无。

## 验证方式

相关测试、`format:check`、`build:verify`。
