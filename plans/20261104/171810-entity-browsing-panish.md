# Plan：新增菜单「实体浏览」

## 需求理解

- 侧栏新增「实体浏览」导航。
- 以现有空间内管理（`/workspace/ontology-space-management/:spaceId/object`）为框架：Tab + 概念层级树 + 对象卡片区。
- 在框架上方增加「统计信息」「质量情况」。
- 入口固定空间 id：`23`。
- 对象卡片操作仅保留「查看」「导出」（隐藏编辑、删除）；新建对象与分类树增删改在浏览模式下同步隐藏。
- Tab 与图二一致，保留五个（含行为调度）。
- 无后端质量/总览实体统计接口：统计与质量使用页面 Mock。

## 修改范围

- 新增实体浏览页面壳与路由。
- 导航菜单增加入口。
- 对象工作区支持 `browseOnly`（路由 meta）。
- 面包屑识别实体浏览。
- 配套类型、测试与格式检查。

## 新增 / 修改 / 删除文件

### 新增

- `src/views/EntityBrowsing/index.vue`
- `src/views/EntityBrowsing/components/EntityBrowseOverview.vue`
- `src/views/EntityBrowsing/components/WorkspaceTypeTabs.vue`
- `src/views/EntityBrowsing/composables/useEntityBrowseOverview.ts`
- `src/views/EntityBrowsing/composables/useEntityBrowseWorkspace.ts`
- `src/views/EntityBrowsing/utils/workspaceTabs.ts`
- `src/views/EntityBrowsing/utils/overviewStats.ts`
- `src/views/EntityBrowsing/utils/spaceLookup.ts`
- `src/views/EntityBrowsing/mocks/entityBrowseOverviewMock.ts`
- `src/types/pages/entityBrowsingType.ts`
- `tests/entity-browsing.test.mjs`

### 修改

- `src/router/modules/workspaceRoutes.ts`
- `src/layout/components/NavigationMenu.vue`
- `src/layout/components/BreadcrumbBar.vue`
- `src/views/ObjectWorkspacePanel/index.vue`
- `src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue`
- `src/views/ObjectWorkspacePanel/components/ConceptHierarchyTree.vue`
- `src/types/index.ts`
- 相关既有测试（如需适配 browseOnly 文案断言）

### 删除

- 无

## 核心实现方式

1. 路由：`/workspace/entity-browsing/:spaceId`，默认 `spaceId=23`，redirect 到 `object`；子路由挂载现有 `ObjectWorkspacePanel` / 关系 / 函数算子 / 行为 / 行为调度，meta 增加 `browseOnly: true`。
2. `EntityBrowsing` 页面：顶部 Mock 统计（本体数量、关系数量、实体数量）与质量（韧性标准应用数、属性填充率）→ Tab → `router-view`。
3. `ObjectWorkspacePanel` 读取 `route.meta.browseOnly`，传给列表与概念树：仅「查看」「导出」，隐藏新建/编辑/删除及分类树写操作。
4. 不跨页面引用 `OntologySpaceManagementDetail` 私有实现；Tab/空间加载逻辑在 `EntityBrowsing` 内自洽复刻。

## 新增依赖及必要性

- 无。

## 验证方式

- `npm test`、`npm run test:coverage`
- `npm run type-check`、`npm run build:verify`
- `npm run format:check -- <任务文件列表>`
- `git diff --check`、`git status --short`
