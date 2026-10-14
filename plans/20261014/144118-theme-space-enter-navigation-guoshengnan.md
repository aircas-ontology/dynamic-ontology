# 主题空间"进入"跳转空间内管理 + 面包屑进入路径

- 日期时间：2026-10-14 14:41:18（Asia/Shanghai）
- 分支：dev_sthq_1012_only
- 状态：已确认（用户"确认"）

## 需求理解

主题空间卡片和表格的"进入"按钮（当前为占位提示 `notifyUnavailable('进入主题空间')`）改为与对象空间管理一致的跳转——进入空间内管理页（默认 Overview）；面包屑按进入来源显示"主题空间管理 / {空间名}"并可跳回，切换 tab 后保持。

## 修改范围

4 个源码文件 + 2 个测试文件，无新增/删除文件，无新增依赖：

1. `src/views/ThemeSpaceManagement/index.vue`
2. `src/views/OntologySpaceManagementDetail/index.vue`
3. `src/layout/components/BreadcrumbBar.vue`
4. `tests/ontology-space-management.test.mjs`（TDD 先行）
5. `tests/layout-navigation.test.mjs`（TDD 先行）

## 核心实现方式

- ThemeSpaceManagement：新增 `enterThemeSpace(space)`，复用对象空间管理跳转目标 `{ name: "OntologySpaceManagementDetailOverview", params: { spaceId: space.id } }`，并带 `query: { spaceName: space.displayName, from: "theme-space-management" }`；卡片与表格两处"进入"按钮改为调用它。
- OntologySpaceManagementDetail：`openTab` 透传 `query: route.query`，保证切 tab 后 `from`/`spaceName` 不丢失；对象空间路径 query 为空，行为不变。
- BreadcrumbBar：`subspaceEntryLabel`/`subspaceEntryTarget` 重命名为 `spaceEntryLabel`/`spaceEntryTarget`（两个分支共用）；`isSpaceDetail` 分支第一级改用动态 label/target（复用既有 `isFromThemeSpace`）；`spaceDisplayName` 在 isSpaceDetail 时优先读 `query.spaceName`，无 query 时走 store（对象空间路径行为不变）。
- 测试：ontology-space-management 断言 `enterThemeSpace`、`OntologySpaceManagementDetailOverview`、`from: "theme-space-management"` 且不再含"进入主题空间功能暂未接入"；layout-navigation 断言 isSpaceDetail 分支使用 `spaceEntryTarget`。

## 风险说明

空间内管理页内部取数当前用 `type: 0`（对象空间列表），主题空间 id 在该列表中可能不存在，页面内部可能显示加载失败/空名——与 type=1 数据缺口同源，属数据侧待支持项；本次范围仅覆盖跳转与面包屑，缺口记录在交付报告。

## 验证方式

1. TDD 红 → 实施 → 绿：`node --test tests/ontology-space-management.test.mjs tests/layout-navigation.test.mjs`。
2. 全量：`npm test`（基线 12 个预存失败保持、无新增）、`npm run type-check`（基线 4 个预存、无新增）、`npm run build:verify`。
3. `npm run format:check -- <任务文件列表>`。
4. 浏览器冒烟：主题空间"进入"跳转、面包屑"主题空间管理 / {空间名}"两级显示与跳回、切 tab 后面包屑保持、对象空间管理"进入"路径回归（仍显示"对象空间管理"）。
