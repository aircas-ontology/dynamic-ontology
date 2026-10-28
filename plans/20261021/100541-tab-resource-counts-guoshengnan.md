# Plan：空间资源统计显示到 tab 菜单

- 时间：2026-10-21 10:05:41（Asia/Shanghai）
- git-user：guoshengnan
- 状态：已确认

## 需求理解

对象空间详情页顶部 tab 菜单上，5 个资源 tab（对象、关系、函数算子、行为、行为调度）以文字后缀显示各自统计数量（如「对象 22」，加载中/失败/无数据显示「—」）；概览 tab（空间名）不显示数字。概览页内「空间资源统计」卡片保留，行为不变。

## 修改范围

统计数据现由概览页内部加载（`useSpaceOverview` → `getOntologySpaceStatisticInterface`）。将加载提升到详情布局层，通过 provide/inject 共享给概览页，同一接口仅请求一次。

### 修改文件（无新增/删除文件，无新增依赖）

1. `src/views/SpaceOverviewPanel/composables/useSpaceOverview.ts`
   - 新增导出 `SpaceOverviewContext` 类型（`useSpaceOverview` 返回结构）、`SPACE_OVERVIEW_KEY`（`InjectionKey`）、`injectSpaceOverviewContext()` 帮助函数（缺失时抛错，概览页仅应作为详情布局子路由渲染）。
   - 现有加载逻辑不改。
2. `src/views/OntologySpaceManagementDetail/index.vue`
   - 调用 `useSpaceOverview(spaceId)`（复用 `useSpaceWorkspace` 已有 `spaceId`），`provide(SPACE_OVERVIEW_KEY, ...)`。
   - 向 `WorkspaceTypeTabs` 传 `:counts` / `:counts-loading`（computed）。
3. `src/views/OntologySpaceManagementDetail/components/WorkspaceTypeTabs.vue`
   - 新增 props `counts?: Partial<Record<Exclude<ManagementWorkspaceTab, "overview">, number>>`、`countsLoading?: boolean`。
   - 资源 tab 文字后追加后缀，复用 `formatOverviewStat` 格式化（千分位；加载中/无数据「—」）。
   - 新增 `.workspace-type-tabs__count` 样式（次级文字色、tabular-nums，active 态主色）。
4. `src/views/SpaceOverviewPanel/index.vue`
   - 改为 `injectSpaceOverviewContext()` 消费统计上下文；移除自身接口调用与本地 `spaceId` 计算。
   - 统计卡片、error 告警、重试按钮全部保留（重试走注入的 `loadSpaceOverview`）。

### 测试文件（TDD 先红后绿）

- `tests/ontology-space-management-detail.test.mjs`：新增 WorkspaceTypeTabs 后缀 props/渲染/样式断言、布局层 provide 与数据传递断言。
- `tests/space-overview.test.mjs`：新增概览页 inject 化断言、key 导出断言。

## 公用组件影响

- `WorkspaceTypeTabs` 仅被详情布局使用；主题空间走同一布局，tab 统计同样生效（与其概览页现状一致），对象空间来源行为不变。
- 新手引导锚点 `workspace-tab-${tab.id}` 保留在 tab 按钮上，引导功能不受影响。

## 新增依赖

无。

## 验证方式

- `npm test`：19 个既有基线失败不变，新增测试先红后绿。
- `npm run type-check`：9 个既有基线错误零新增。
- `npm run build:verify`。
- 任务文件 `npm run format` 后 `format:check` 通过。
- 浏览器冒烟：tab 数字后缀 + 概览页卡片回归。若后端登录仍被拒（`guoshengnan` 登录接口返回「用户名或密码错误」，属环境问题）则如实记录验证缺口。
