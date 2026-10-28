# Plan：路由挂载面板改为 Name/index.vue

## 需求理解

路由 `component` 懒加载路径统一以 `index.vue` 结尾。仅改造被路由直接挂载的面板；顶层页面已是 `index.vue` 的保持不变。同步更新 `src/views/readme.md` / `src/router/readme.md`。

## 修改范围

搬迁（git mv）：

1. `OntologySpaceManagementDetail/components/SpaceOverviewPanel.vue` → `SpaceOverviewPanel/index.vue`
2. `.../ObjectWorkspacePanel.vue` → `ObjectWorkspacePanel/index.vue`
3. `.../relationComponents/SpaceRelationWorkspace.vue` → `SpaceRelationWorkspace/index.vue`
4. `.../functionOperatorComponents/FunctionOperatorPanel.vue` → `FunctionOperatorPanel/index.vue`
5. `.../behaviorComponents/SpaceBehaviorWorkspace.vue` → `SpaceBehaviorWorkspace/index.vue`
6. `.../behaviorScheduleComponents/SpaceBehaviorScheduleWorkspace.vue` → `SpaceBehaviorScheduleWorkspace/index.vue`
7. `OntologyObjectDetail/components/OntologyObjectOverviewPanel.vue` → `OntologyObjectOverviewPanel/index.vue`
8. `.../OntologyObjectAttributePanel.vue` → `OntologyObjectAttributePanel/index.vue`
9. `.../behaviorComponents/ObjectBehaviorWorkspace.vue` → `ObjectBehaviorWorkspace/index.vue`

并修改：

- `src/router/modules/workspaceRoutes.ts`
- 上述文件内相对 import
- 硬编码旧路径的 tests
- `src/views/readme.md`、`src/router/readme.md`

## 核心实现

- 路由写完整路径 `.../PanelName/index.vue`
- 相对路径按多一层目录调整
- 不批量改造非路由挂载的私有组件

## 新增依赖

无

## 验证

- 相关路径测试、`npm run type-check`、任务文件 format:check
