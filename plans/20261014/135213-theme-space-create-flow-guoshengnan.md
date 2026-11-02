# Plan：新建主题空间确认后进入子空间创建流程 + 面包屑调整

- 日期：2026-10-14 13:52:13 (Asia/Shanghai)
- 分支：dev_sthq_1012_only
- 状态：已确认

## 需求理解

1. 主题空间管理页"新建主题空间"弹窗点击"确认"后，不再提示"暂未接入"，改为关闭弹窗并直接进入子空间创建流程页（OntologySubspaceCreate），携带所选对象空间的 `spaceId`、`spaceName` 与来源标识 `from=theme-space-management`；未选择对象空间时提示"请选择对象空间"。
2. 面包屑跟随当前进入路径：从主题空间管理进入时第一级显示"主题空间管理"（可点击跳回）；从对象空间管理进入时保持现状"对象空间管理"。
3. 面包屑第三级标题（路由 meta.title）由"创建子空间"改为"创建主题空间"，页面 aria-label 同步。

## 修改范围

| 文件 | 变更 |
| --- | --- |
| src/views/ThemeSpaceManagement/index.vue | `confirmCreateThemeSpace` 改为：校验已选对象空间 → 关闭弹窗 → `router.push({ name: "OntologySubspaceCreate", params: { spaceId }, query: { spaceName, from: "theme-space-management" } })`；引入 `useRouter` |
| src/router/modules/workspaceRoutes.ts | OntologySubspaceCreate 的 `meta.title`："创建子空间" → "创建主题空间" |
| src/layout/components/BreadcrumbBar.vue | isSubspaceCreate 分支：第一级按 `query.from` 渲染（主题空间管理 → 名称 + 跳回 ThemeSpaceManagement；否则现状）；第二级空间名优先读 `query.spaceName`；fallback 文案同步"创建主题空间" |
| src/views/OntologySubspaceCreate/index.vue | 页面 `aria-label` 同步"创建主题空间" |
| tests/ontology-space-management.test.mjs | 新增断言：确认按钮校验 + 跳转（含 from 参数）；路由 `meta.title` 为"创建主题空间" |
| tests/layout-navigation.test.mjs | 面包屑"创建子空间"断言更新为"创建主题空间" |
| tests/ontology-space-management-detail.test.mjs | `aria-label="创建子空间"` 断言同步更新 |

面包屑第二级跳转目标保持现状（OntologySpaceManagementDetail）；对象空间管理入口（useSpaceManagementActions.ts）不传 from，行为不变。

## 核心实现方式

- TDD：先更新/新增测试断言并确认失败，再实现并验证通过。
- ThemeSpaceManagement 使用 `useRouter` 做声明式跳转，与对象空间管理跳转形态保持一致。
- BreadcrumbBar 通过 `route.query.from === "theme-space-management"` 判断来源，仅影响子空间创建分支的第一级渲染；第二级空间名 `query.spaceName` 优先，fallback 既有 store 显示名。

## 新增依赖

无。

## 验证方式

- `npm.cmd test`：新增断言通过，既有失败保持基线并单独记录。
- `npm.cmd run type-check`：无新增错误（基线 4 个预存错误）。
- `npm.cmd run build:verify` 通过。
- `npm.cmd run format:check -- <触碰文件>` 通过。
- 浏览器冒烟：主题空间管理 → 新建主题空间 → 选择对象空间 → 确认 → 进入创建流程页，面包屑显示"主题空间管理 / 对象空间名 / 创建主题空间"；未选择对象空间时确认给出提示。
