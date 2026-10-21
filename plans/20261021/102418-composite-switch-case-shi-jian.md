# 函数编排 Switch Case 逻辑组件

## 需求理解

依据 docs/20261021/shijian.md：

1. 左侧「逻辑」列表在「条件分支」下方增加 Switch Case
2. 配置：从上游输出中选择一个 switch 值
3. 可增删多个 case，值手填（非空、互不重复）
4. 节点出口与 case 一一对应，出口旁展示 case 文案，并固定 default 出口

约定：

- 匹配语义：上游选中值与 case 字符串全等
- 新建默认：1 个空 case + 始终存在的 default 出口；确定时至少 1 个非空 case
- 透传：与条件分支相同
- 视觉：矩形多出口（左入、右侧 case… + default）
- LiteFlow：`SWITCH(id).TO(CASE("v1", …), CASE("v2", …), DEFAULT(…))`

## 修改范围

- 类型、switch 默认/归一、锚点、节点注册、图读写/透传、LiteFlow、画布、侧栏与 Logic 抽屉、测试
- 不改后端 API、行为调度页 Switch、public/html；无新依赖

## 新增、修改和删除文件

### 新增

- `src/views/FunctionOperatorPanel/utils/compositeWorkflowSwitchDefaults.ts`
- 本 Plan 文件

### 修改

- `src/types/pages/ontologyCompositeWorkflowType.ts`
- `compositeWorkflowAnchors.ts`、`registerCompositeWorkflowNodes.ts`
- `compositeWorkflowGraph.ts`、`compositeWorkflowLiteFlowEl.ts`
- `useCompositeWorkflowCanvas.ts`
- `FunctionOperatorCompositeWorkflowDialog.vue`、`FunctionOperatorCompositeLogicNodeDialog.vue`
- `tests/composite-workflow-utils.test.mjs`（及必要时专测）

## 核心实现方式

1. 类型增加 `switch` kind、`CompositeWorkflowSwitchConfig`、边 `switchOutlet`
2. 注册 `composite-switch` 矩形动态锚点与出口标注
3. 侧栏插入；Logic 抽屉配置 switchOn + cases
4. 连线写入 switchOutlet；上游透传；LiteFlow emitSwitch

## 新增依赖及必要性

无。

## 验证方式

TDD：默认/归一、锚点、透传、LiteFlow、侧栏/抽屉契约。  
`npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`、`npm run format:check -- <改动文件>`。
