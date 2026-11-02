# 条件分支菱形与判断逻辑

## 需求理解

依据 docs/20261020/shijian.md §16–21：

1. 条件分支节点视觉改为菱形。
2. 判断：选择上游输出值 + 比较运算符（`==` / `!==` / `>` / `>=` / `<` / `<=`）+ 填写右值；出口 true 右侧、false 下侧。
3. 「条件节点的分支和上游节点的输出完全一致」：true/false 下游读取到的上游输出树，与分支节点自身上游一致（分支透传，不另造输出）。

## 修改范围

- 节点注册与锚点：`src/views/FunctionOperatorPanel/utils/registerCompositeWorkflowNodes.ts`
- 分支配置类型：`src/types/pages/ontologyCompositeWorkflowType.ts`
- 配置弹框：`src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeLogicNodeDialog.vue`
- 画布上下文与上游解析：`src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts`
- 新建默认与图读写默认值：同 composable + `compositeWorkflowGraph.ts` 中 branch 默认 config
- 测试：扩展 `tests/composite-workflow-utils.test.mjs`

不改 LiteFlow 表达式生成（仍按边 `branch: true|false`）；不新增依赖。

## 新增、修改和删除文件

### 修改

- `src/views/FunctionOperatorPanel/utils/registerCompositeWorkflowNodes.ts`
- `src/types/pages/ontologyCompositeWorkflowType.ts`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeLogicNodeDialog.vue`
- `src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts`
- `src/views/FunctionOperatorPanel/utils/compositeWorkflowGraph.ts`
- `tests/composite-workflow-utils.test.mjs`

### 新增（按实现需要）

- 分支配置归一化 / 上游透传纯函数（可放在 `compositeWorkflowGraph.ts` 或独立小工具文件）

## 核心实现方式

1. `composite-branch` 单独注册 DiamondNode + DiamondNodeModel；锚点左入、右 true、下 false。
2. `CompositeWorkflowBranchConfig`：left 固定 fromUpstream（含 path）；去掉 truthy；right 必填 manual。
3. 弹框：上游输出 select（任意层级）+ 运算符符号 + 右值；打开时注入 upstreamOutputs。
4. `resolveUpstreamOutputs` 对 branch 前驱递归透传。

## 新增依赖及必要性

无。

## 验证方式

TDD：先写锚点约定、默认 config、透传测试 → 失败 → 实现 → 通过。

- `npm test`、`npm run test:coverage`
- `npm run type-check`、`npm run build:verify`
- `npm run format:check -- <本次修改文件列表>`
