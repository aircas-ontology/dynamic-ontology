# 行为调度规则配置画布（第一期）

## 需求理解

在空间详情「行为调度」的新建 / 编辑调度弹窗中，规则调度的「规则配置」打开全屏画布。第一期只交付画布交互与保存：左侧节点面板拖拽、端口连线、工具栏（清空 / 自动布局 / 适应画布 / 删除选中）、页脚取消与保存。保存后把 `ScheduleRuleFlowDocument` 写回调度草稿，按钮文案变为「规则配置（已应用）」。自定义变量、规则代码、AI 生成规则、双击节点配置弹窗留到后续迭代。查看模式按钮保持禁用，不打开画布。单个 Vue 文件不超过 500 行，超出则拆分。

## 修改范围

- 调度草稿增加 `ruleFlow`。
- 用 `@antv/x6` 复刻原型规则流画布（`resetCells` 整图替换、卸载 `dispose`）。
- 用 `@antv/layout` 的 `DagreLayout` 做自动布局。
- 全屏 `aircas-dialog`：返回、取消、保存；不放自定义变量 / 规则代码 / AI 按钮。
- 图逻辑放到页面 `utils/`，Vue 只做编排。

## 新增、修改和删除文件

新增：

- `src/views/OntologySpaceManagementDetail/behaviorScheduleComponents/BehaviorScheduleRuleConfigDialog.vue`
- `src/views/OntologySpaceManagementDetail/behaviorScheduleComponents/ruleConfig/ScheduleRuleFlowDesigner.vue`
- `src/views/OntologySpaceManagementDetail/behaviorScheduleComponents/ruleConfig/ScheduleRuleFlowPalette.vue`
- `src/views/OntologySpaceManagementDetail/behaviorScheduleComponents/ruleConfig/ScheduleRuleFlowToolbar.vue`
- `src/views/OntologySpaceManagementDetail/utils/scheduleRuleFlowFactory.ts`
- `src/views/OntologySpaceManagementDetail/utils/scheduleRuleFlowGraphCells.ts`
- `src/views/OntologySpaceManagementDetail/utils/scheduleRuleFlowGraphSerialize.ts`
- `src/views/OntologySpaceManagementDetail/utils/scheduleRuleFlowGraphSession.ts`
- `tests/behavior-schedule-rule-canvas.test.mjs`
- 本 Plan 文件

修改：

- `src/types/pages/ontologySpaceBehaviorScheduleType.ts`
- `src/types/index.ts`
- `src/views/OntologySpaceManagementDetail/behaviorScheduleComponents/BehaviorScheduleFormDialog.vue`
- `src/views/OntologySpaceManagementDetail/behaviorScheduleComponents/SpaceBehaviorScheduleWorkspace.vue`
- `package.json` / `package-lock.json`（新增 `@antv/layout`）
- `tests/behavior-schedule-create-dialog.test.mjs`（去掉「暂未接入」断言，覆盖已应用文案）

不修改：`public/`、`html/`、`SubspaceCreateTreePanel.vue`、对象行为页。

## 核心实现方式

- 类型只描述规则流文档与条件 / 值节点；工厂、摘要、克隆放页面 utils。
- 默认文档 `{ steps: [createBranchStep()] }`：规则开始 → 条件菱形 → 未配置行为。
- Graph 非响应式；渲染走 `createNode`/`createEdge` 缓冲后 `resetCells`；卸载 `dispose`。
- 拖拽 MIME `application/x-rule-node`；连线 manhattan + rounded；禁止成环、禁止连到开始节点。
- 保存序列化从开始节点走出边重建 `steps`。
- 打开弹窗用 `key` 重建设计器，避免把未接入节点写回文档后整图冲掉。

## 新增依赖及必要性

- `@antv/layout@^0.3.25`：原型自动布局使用 `DagreLayout`，当前仓库只有 `@antv/x6`，X6 本身不含该布局算法。

## 验证方式

- TDD：先写源码契约测试（无「暂未接入」、存在全屏弹窗 / Graph / dispose / Dagre / Vue 行数 ≤ 500），确认失败后再实现。
- `npm test`、`npm run test:coverage`
- `npm run type-check`、`npm run build:verify`
- `npm run format:check -- <任务文件>`
- 浏览器：新建调度 → 规则调度 → 规则配置 → 画布可见 → 保存 → 按钮变为「规则配置（已应用）」
