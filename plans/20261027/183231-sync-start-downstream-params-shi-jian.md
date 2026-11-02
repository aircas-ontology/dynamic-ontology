# 开始节点参数变更同步下游

## 需求理解

开始节点入参变更确认后，下游查看「来自上游」应反映最新参数。

## 修改范围

- `useCompositeWorkflowCanvas.ts`：开始确认后刷新下游绑定；打开配置读最新 model
- `compositeWorkflowGraph.ts`：start 输出带 sourceNodeId
- 相关测试

## 新增、修改和删除文件

**修改**

- `src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts`
- `src/views/FunctionOperatorPanel/utils/compositeWorkflowGraph.ts`
- `tests/composite-workflow-utils.test.mjs`
- `tests/function-operator-workspace.test.mjs`

## 核心实现方式

开始确认后 BFS 刷新可达下游 function/transform/end 绑定；打开对话框用 live properties；start brief 写 sourceNodeId。

## 新增依赖

无。

## 验证方式

相关测试、`format:check`、`build:verify`。
