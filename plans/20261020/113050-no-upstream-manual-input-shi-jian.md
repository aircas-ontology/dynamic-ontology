# Plan：无前驱时展示 INPUT 并支持手动输入

## 需求理解

无前驱的函数节点配置抽屉应：

1. 展示该函数的 INPUT 参数（与详情一致）
2. 入参绑定全部为「手动输入」，可填值

根因：`Boolean(paramsSnapshot?.inputs)` 对空数组为 true，连线补上游输出时写入的 `inputs: []` 会挡住详情 INPUT。

## 修改范围

仅函数编排：节点详情加载与上游输出补全；不改接口契约；不改有前驱时的上游映射语义。

## 新增、修改和删除文件

| 操作 | 路径                                                                                         |
| ---- | -------------------------------------------------------------------------------------------- |
| 修改 | `src/views/FunctionOperatorPanel/utils/compositeWorkflowGraph.ts`                            |
| 修改 | `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeFunctionNodeDialog.vue` |
| 修改 | `src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts`                  |
| 修改 | `tests/composite-workflow-utils.test.mjs`                                                    |

## 核心实现方式

1. 新增纯函数：按快照与详情合并 INPUT/OUTPUT——快照对应方向 `length > 0` 时用快照，否则从详情 `category` 映射。
2. 函数节点抽屉加载详情时使用该纯函数，无前驱仍走已有 align/default（叶子均为 manual）。
3. `ensureUpstreamFunctionOutputs` 写快照时：现有 inputs 为空则一并写入详情 INPUT；outputs 仍从详情 OUTPUT 写入。

## 新增依赖及必要性

无。

## 验证方式

- TDD：空 inputs 快照仍从详情得到 INPUT；无前驱绑定为 manual；更新 ensureUpstream 相关断言。
- `npm test`、`npm run test:coverage`
- `npm run format:check -- <任务文件>`
- `npm run type-check`、`npm run build:verify`
