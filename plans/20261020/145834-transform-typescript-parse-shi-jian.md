# Plan：数据格式转换节点 TypeScript + 解析 + 上下游

## 需求理解

1. 仅支持 TypeScript；默认脚本模版为用户提供的 `handle` 代码。
2. 复用现有 Monaco 脚本编辑器。
3. 确定时调用解析接口并展示 INPUT/OUTPUT。
4. 连线后可选上游输出；本节点解析 OUTPUT 供下游选择。

## 修改范围

编排 `transform` 节点类型、专用配置抽屉、画布上下游解析；loop/branch 逻辑不变。

## 新增、修改和删除文件

| 操作 | 路径                                                                           |
| ---- | ------------------------------------------------------------------------------ |
| 修改 | `ontologyCompositeWorkflowType.ts`                                             |
| 新增 | `FunctionOperatorCompositeTransformNodeDialog.vue`                             |
| 修改 | `FunctionOperatorCompositeLogicNodeDialog.vue`（去掉 transform）               |
| 修改 | `useCompositeWorkflowCanvas.ts`、`FunctionOperatorCompositeWorkflowDialog.vue` |
| 修改 | `compositeWorkflowGraph.ts`                                                    |
| 修改 | 相关 tests                                                                     |

## 核心实现方式

1. `language: "typescript"` + `paramsSnapshot` + `inputBindings`；默认代码为用户模版。
2. 专用 Transform 抽屉：Monaco、确定前解析、展示 IO、有前驱时入参绑定。
3. `resolveUpstreamOutputs` 优先用 `paramsSnapshot.outputs` 全树。

## 新增依赖及必要性

无。

## 验证方式

TDD、format:check、相关单测、type-check、build:verify。
