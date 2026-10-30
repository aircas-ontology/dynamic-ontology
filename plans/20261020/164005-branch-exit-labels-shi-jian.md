# 条件分支出口标注 true / false

## 需求理解

依据 docs/20261020/shijian.md 第 22 行：分支节点两个出口要标出 true 和 false（右侧 true、下侧 false）。

## 修改范围

- `src/views/FunctionOperatorPanel/utils/registerCompositeWorkflowNodes.ts`
- `tests/composite-workflow-utils.test.mjs`

## 新增、修改和删除文件

### 修改

- 上述注册与测试文件

### 新增 / 删除

- 无源码新增或删除（仅本 Plan 历史文件）

## 核心实现方式

自定义 `DiamondNode` 视图，在 `getShape` 中于右侧/下侧锚点外侧绘制 `true` / `false` 文本。

## 新增依赖及必要性

无。

## 验证方式

相关 test、`type-check`、`build:verify`、任务范围 `format:check`。
