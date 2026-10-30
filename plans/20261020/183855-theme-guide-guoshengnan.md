# 主题模块新手引导 + 帮助按钮调整 Plan

- 时间：2026-10-20 18:38:55（Asia/Shanghai）
- 分支：dev_sthq_1013
- 关联需求：主题模块六链新手引导；主题管理页内容右上角新增帮助按钮；删除顶栏帮助按钮

## 需求理解

1. 按对象空间管理模块已有的六链引导架构，为主题模块新增新手引导：
   - 链 1「新建主题」（12 小步）：主题列表页（新建主题按钮 → 弹窗选择空间 → 确认）→ 主题创建页（分类树勾选两个对象 → 已选卡片 → 下一步 → 实例可不选 → 下一步 → 属性至少 1 条且含主键 → 下一步 → 关系可不选 → 创建，创建后返回主题列表）。
   - 链 2「创建对象」：主题列表页「进入」按钮 → 主题内模块，复用对象空间链 2 全部小步（主题数组中链名映射为「创建对象」）。
   - 链 3-6：与对象空间完全一致，直接复用。
2. 主题管理页（ThemeSpaceManagement）内容右上角添加帮助按钮（与对象空间列表页样式一致：fixed top 62px / right 18px）。
3. 删除 HeaderBar 顶栏的帮助按钮（禁用占位「帮助暂未开放」）。

## 复用与影响判断

- 主题内模块与对象空间内管理为同一页面（OntologySpaceManagementDetail），链 2-6 步骤对象直接复用，跨页续接由 sessionStorage 按 page id 匹配完成。
- WelcomePanel 的 `.welcome-panel__create` 为既有 class，主题页只消费不修改组件；两页不同路由、各自挂载 overlay，互不影响。
- OntologySubspaceCreate 同时被对象空间「新建子空间」使用：该页主题引导接线（帮助按钮、overlay）以 `route.query.from === "theme-space-management"` 为条件渲染；新增 data-onboarding 锚点为纯属性，对象空间子空间流程行为不变。
- OntologySpaceManagementDetail 仅在 URL 携带 `from=theme-space-management` 时切换为主题步骤数组，对象空间进入时保持 `ONBOARDING_GUIDE_STEPS`。
- sessionStorage 续接按 page id 匹配，`theme-list`/`theme-create` 与对象空间流程步骤互不误续接。

## 文件清单

新增：无。
修改：
1. `src/composables/shared/useOnboardingGuide.ts`：`OnboardingGuidePageId` 增加 `"theme-list" | "theme-create"`。
2. `src/views/onboardingGuideSteps.ts`：新增主题链 1 的 12 小步与 `theme-list-enter`；导出 `THEME_ONBOARDING_GUIDE_STEPS`（链 2-6 复用，链名「新建对象」映射为「创建对象」）；`ONBOARDING_GUIDE_ENTRY_IDS` 与 `ONBOARDING_GUIDE_EMBEDDED_ENTRY_IDS` 补充 theme 条目。
3. `src/views/ThemeSpaceManagement/index.vue`：内容右上角帮助按钮 + 引导接线（page `theme-list`）；新建主题弹窗（选择空间/取消/确认）与卡片、表格「进入」按钮加 data-onboarding 锚点。
4. `src/views/OntologySubspaceCreate/index.vue`：仅主题来源渲染帮助按钮与 overlay（page `theme-create`）。
5. `src/views/OntologySubspaceCreate/components/SubspaceCreateTreePanel.vue`：树加 `data-onboarding="subspace-create-tree"`。
6. `src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue`：已选卡片、下一步、创建按钮、实例面板、属性区、关系表与 el-empty（共用 `subspace-create-relation-panel`）加锚点。
7. `src/views/OntologySpaceManagementDetail/index.vue`：steps 按路由 `from` 参数切换主题/对象数组。
8. `src/layout/components/HeaderBar.vue`：删除帮助按钮及 `QuestionFilled` 导入。
9. `tests/onboarding-guide.test.mjs`：主题步骤配置、页面接线、锚点、HeaderBar 删除断言及对象空间回归断言。

删除：HeaderBar 帮助按钮（随文件 8）。

## 核心实现方式

- 主题链 1 小步：`theme-create-open`（advanceOnTargetClick）、`theme-create-select-space`、`theme-create-confirm`（advanceOnTargetClick，页面自身路由跳转到创建页）；`theme-subspace-tree`、`theme-subspace-cards`、`theme-subspace-next-objects`、`theme-subspace-instances`、`theme-subspace-next-instances`、`theme-subspace-properties`、`theme-subspace-next-properties`、`theme-subspace-relations`、`theme-subspace-create`（advanceOnTargetClick，创建成功后 router.back 回主题列表续接链 2）。
- 弹窗类小步配 `exitClickSelector`（`theme-create-cancel`）实现换链自动关弹窗；「下一步/创建」按钮类小步配 `advanceOnTargetClick`。
- 关系步骤为空属正常态：`subspace-create-relation-panel` 同时落在关系表与 el-empty 上，避免误导性 Mock 兜底。
- 嵌入模式：主题页当前未区分嵌入模式（创建按钮始终显示），两张入口表 theme 条目取相同入口 id。

## 新增依赖

无。

## 验证方式

1. TDD：新增断言先红，实现后 `npm test` 全绿（基线 19 处既有失败保持零新增）。
2. `npm run type-check`：既有 9 处错误零新增。
3. `npm run format:check -- <本次修改文件列表>`。
4. 浏览器冒烟：主题列表帮助按钮打开引导并走查链 1 关键步骤；对象空间引导回归抽查；顶栏帮助按钮消失。
