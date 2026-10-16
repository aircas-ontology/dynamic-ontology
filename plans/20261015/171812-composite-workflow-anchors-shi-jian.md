# 编排画布锚点左入右出（方案 B）

## 需求理解

- 普通节点（function / loop / transform）：仅左侧 1 个输入锚点、右侧 1 个输出锚点。
- 分支节点（branch）：左侧 1 个输入；右侧保留 true / false 双输出锚点（与设计一致）。
- 连线只能从输出锚点连到输入锚点；落点须靠近目标锚点，不能吸附到节点边框任意位置。

## 修改范围

- `src/views/FunctionOperatorPanel/utils/compositeWorkflowAnchors.ts`（新增，锚点判定纯函数）
- `src/views/FunctionOperatorPanel/utils/registerCompositeWorkflowNodes.ts`
- `src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeWorkflowDialog.vue`（引导文案）
- `tests/composite-workflow-utils.test.mjs`

## 新增 / 修改 / 删除文件

- 新增 `compositeWorkflowAnchors.ts`；修改上述其余文件；无新增依赖；无删除。

## 核心实现方式

1. 所有节点覆写 `getDefaultAnchor`：左 `_in`；普通节点右 `_out`；branch 右 `_out_true` / `_out_false`。
2. `getConnectedSourceRules`：仅允许从 `_out` / `_out_true` / `_out_false` 作为起点。
3. `getConnectedTargetRules`：仅允许落到 `_in`。
4. LogicFlow `customTargetAnchor`：仅当落点与最近锚点距离 ≤ 阈值时返回该锚点，否则拒绝吸附。
5. 画布引导文案改为「左入右出；分支右侧双出口为 true / false」。

## 新增依赖及必要性

无。

## 验证方式

- `npm run format:check --` 上述修改文件。
- 手工：普通节点仅左右两锚点；分支左一右二；只能右出左入；拖到边框中部无法连线。
