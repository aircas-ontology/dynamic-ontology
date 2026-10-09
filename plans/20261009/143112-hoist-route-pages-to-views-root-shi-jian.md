# Plan：路由页面目录提升到 src/views 根下

## 需求理解

页面级文件夹只能作为 `src/views/` 的直接子目录，不能嵌套在其他页面内。路由懒加载仍以 `index.vue` 结尾。父页（空间内管理、对象详情）只保留壳与 Tab，`router-view` 子页面提升为独立页面目录。URL 与路由 `name` 不变。

## 修改范围

将 9 个嵌套路由面板提升为 `src/views/<PageName>/`，并把该页专用的 components、composables、utils 一并迁入。关系页与函数算子页共用的 `mapOntologyObjectsToRelationOptions` 放到 `src/utils`，避免页面互相引用私有实现。

不修改 `public/`、`html/`，不处理工作区无关改动（当前仅有未跟踪的 `docs/20261009/`）。

## 新增、修改和删除文件

- 新增页面目录：`SpaceOverviewPanel`、`ObjectWorkspacePanel`、`SpaceRelationWorkspace`、`FunctionOperatorPanel`、`SpaceBehaviorWorkspace`、`SpaceBehaviorScheduleWorkspace`、`OntologyObjectOverviewPanel`、`OntologyObjectAttributePanel`、`ObjectBehaviorWorkspace`
- `mapOntologyObjectsToRelationOptions.ts` 迁到 `src/utils/`
- 修改 `workspaceRoutes.ts`、`src/views/readme.md`、`src/router/readme.md`、硬编码路径的 tests 与 mock
- 删除空的 `relationComponents` / `functionOperatorComponents` / `behaviorComponents` / `behaviorScheduleComponents` 等原嵌套目录

## 核心实现方式

1. `git mv` 页面入口与专用文件
2. 调整相对 import 为页面内路径；跨页工具改 `@/utils`
3. 路由懒加载改为 `@/views/<PageName>/index.vue`
4. 规范改为：页面目录只出现在 `views/` 根下；页面内私有子组件仍可为单文件 `.vue`

## 新增依赖

无

## 验证方式

任务文件 format:check；相关路径测试；`npm test`；`npm run test:coverage`；`npm run type-check`；`npm run build:verify`；`npm run check:project-conventions`
