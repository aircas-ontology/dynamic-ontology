# Plan：移除空间/对象资源统计页，进入详情直接落到资源 tab

- 日期时间：2026-10-21 10:48:16（Asia/Shanghai）
- git-user：guoshengnan
- 状态：已确认（用户回复「好的，执行吧」）

## 需求理解

1. 对象空间详情页：进入空间页后直接进入「对象」菜单，去掉「空间资源统计」页（概览 tab 页面与其路由）。tab 菜单不再显示第一个空间名称标签，只剩资源 tab；已上线的 tab 统计数字后缀保留。
2. 对象详情页：进入对象详情后直接进入「属性」菜单，去掉「对象资源统计」页（object tab 页面与其路由）。tab 菜单不再显示对象名称标签，只剩资源 tab；统计数字后缀保留。

## 修改范围

### 路由

- `src/router/modules/workspaceRoutes.ts`
  - OntologySpaceManagementDetail 子路由：redirect 由 Overview 改为 Object；删除 overview 子路由。
  - OntologyObjectDetail 子路由：redirect 由 OntologyObjectDetailObject 改为 OntologyObjectDetailAttribute；删除 object 子路由。

### 类型收窄

- `src/types/pages/ontologySpaceManagementDetailType.ts`：`ManagementWorkspaceTab` 去掉 `"overview"`；`OntologySpaceDetailRouteName` 去掉 Overview 路由名；counts 相关 `Exclude` 收窄与 availableTabs 调整。
- `src/types/pages/ontologyObjectDetailType.ts`：`OntologyObjectDetailTab` 去掉 `"object"`；`OntologyObjectDetailRouteName` 去掉 OntologyObjectDetailObject。

### 组件与视图

- `src/views/OntologySpaceManagementDetail/components/WorkspaceTypeTabs.vue`：删除 overview tab 项（label 用 spaceName）、分隔符、item-overview 样式、countSuffix 的 overview 分支；counts 类型收窄。
- `src/views/OntologySpaceManagementDetail/index.vue`：移除对 SpaceOverviewPanel 的 import 与 provide；不再向 tabs 传 spaceName。
- `src/views/OntologyObjectDetail/components/ObjectDetailTabs.vue`：删除 object tab 项（label 用 objectName）、firstMenuTabId、分隔符、item-object 样式与 `tab.id!=='object'` 分支。
- `src/views/OntologyObjectDetail/index.vue`：detailChildProps 移除 object 分支与 overviewListeners 相关绑定；objectName 传参、tabCounts 类型收窄。

### 统计模块搬迁

- `src/views/SpaceOverviewPanel/composables/useSpaceOverview.ts` → `src/views/OntologySpaceManagementDetail/composables/useSpaceOverview.ts`；availableTabs 初始值去掉 "overview"；删除 SPACE_OVERVIEW_KEY 与 injectSpaceOverviewContext（面板删除后无消费者）。
- `src/views/SpaceOverviewPanel/utils/overviewStats.ts` → `src/views/OntologySpaceManagementDetail/utils/overviewStats.ts`。
- 删除 `src/views/SpaceOverviewPanel/` 整目录。
- 删除 `src/views/OntologyObjectOverviewPanel/` 整目录。

### 默认 tab 与状态

- `useObjectDetailWorkspace.ts`：activeTab 默认值 `"object"` → `"attribute"`。
- `objectDetailTabs.ts`：TAB_ROUTE_NAMES / AVAILABLE_OBJECT_DETAIL_TABS 去掉 object。

### 跳转入口改向（4 处）

- `src/views/OntologySpaceManagementDetail/composables/useSpaceManagementActions.ts`：进入空间动作 push Overview → Object。
- `src/views/ThemeSpaceManagement/index.vue`：push Overview → Object（保留 query）。
- `src/views/OntologyConceptualModelCreate/index.vue`：push Overview → Object。
- `src/utils/ontologyGlobalSearchRoute.ts`：空间检索跳 Overview → Object；对象检索跳 OntologyObjectDetailObject → OntologyObjectDetailAttribute。

### 测试（TDD 先改断言跑红）

- `tests/space-overview.test.mjs`：重写（新路径、删面板断言、删 inject 断言、保留 formatOverviewStat/useSpaceOverview 接口断言与 navy mock counts 22）。
- `tests/get-ontology-meta-statistic-api.test.mjs`：panelSource 断言改为对象详情 pageSource tab counts。
- `tests/ontology-space-management-detail.test.mjs`：redirect/路由/tabs/spaceName 断言。
- `tests/ontology-space-management.test.mjs`：进空间动作断言 Overview → Object。
- `tests/ontology-global-search.test.mjs`：检索跳转断言。
- `tests/full-text-search.test.mjs`：对象检索路由断言 OntologyObjectDetailObject → Attribute。
- `tests/embedded-mode-guard.test.mjs`：route path overview → object。

### 不需要改动

- 新手引导（仅使用 workspace-tab-object/relation、object-tab-attribute 锚点，无 overview 锚点）。
- mock `ontologySpaceManagementDetailMock` 的 availableTabs 已不含 overview（实施时 grep 复核）。

## 核心实现方式

- redirect 与类型收窄后，TS 编译器会暴露所有残留的 overview/object 引用，逐一清理。
- 统计模块仅做目录搬迁与导出收敛，布局层单次加载、provide/inject 共享的既有结构保持不变（inject key 随面板删除一并移除）。
- tab 组件删除名称标签后保持剩余资源 tab 的渲染与统计后缀逻辑不变。

## 新增依赖

无。

## 验证方式

- `npm test`：21 个已知基线失败（19 本地旧基线 + 2 远程合并引入），要求零新增失败。
- `npm run type-check`：9 个已知基线错误，要求零新增。
- `npm run build:verify`：通过。
- `npm run format -- <任务文件>` 与 `format:check`。
- 浏览器冒烟：当前后端对 guoshengnan/a123456 返回「用户名或密码错误」，登录受阻，记录验证缺口，待账号恢复后人工目视验收。
- 不执行 git commit / push（用户未要求）。
