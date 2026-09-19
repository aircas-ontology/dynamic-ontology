# Plan：进入空间后的 Tab 壳页与子路由

## 需求理解

从本体空间管理表格/卡片的「进入」跳入空间展示页；只迁移顶部 Tab 栏（对齐原型 `WorkspaceTypeTabs`）；各 Tab 内容先空；用子路由承载概览 / 对象 / 关系 / 函数算子 / 行为 / 行为调度；Mock 解析空间；面包屑展示已进入空间的名称。不迁对象树等业务面板，不接后端。

## 修改范围

| 操作 | 路径 |
| --- | --- |
| 新增 | `src/views/OntologySpaceManagementDetail/index.vue` |
| 新增 | `src/views/OntologySpaceManagementDetail/components/WorkspaceTypeTabs.vue` |
| 新增 | `src/views/OntologySpaceManagementDetail/components/EmptyWorkspacePanel.vue` |
| 新增 | `src/views/OntologySpaceManagementDetail/composables/useSpaceWorkspace.ts` |
| 新增 | `src/views/OntologySpaceManagementDetail/utils/spaceLookup.ts` |
| 新增 | `src/views/OntologySpaceManagementDetail/utils/workspaceTabs.ts` |
| 新增 | `src/types/pages/ontologySpaceManagementDetailType.ts` |
| 新增 | `src/stores/useOntologySpaceDetailStore.ts` |
| 修改 | `src/router/modules/workspaceRoutes.ts` |
| 修改 | `src/views/OntologySpaceManagement/index.vue` |
| 修改 | `src/layout/components/BreadcrumbBar.vue` |
| 修改 | `src/types/index.ts` |
| 新增 | `tests/ontology-space-management-detail.test.mjs` |

## 核心实现方式

- 父路由 `OntologySpaceManagementDetail`：`/workspace/ontology-space-management/:spaceId`，默认重定向 `overview`
- 子路由：overview / object / relation / function-operator / behavior / behavior-schedule
- Tab 点击通过命名路由切换；激活态由当前子路由决定
- 「进入」跳转 `OntologySpaceManagementDetailOverview`
- 面包屑：`首页 > 本体空间管理 > {displayName}`，空间名由 Store 提供
- Mock：复用 `ontologySpaceManagementMock`

## 新增依赖

无。

## 验证方式

- TDD：路由、进入跳转、空间查找、Store、面包屑相关断言
- `npm test`、`npm run test:coverage`
- `npm run type-check`、`npm run build:verify`
- `npm run check:types-conventions`（类型出口变更）
