# 对象工作区拆分逻辑迁移

## 需求理解

对象工作区已经存在分类操作和本体对象操作 composable，但 `ObjectWorkspacePanel.vue` 仍保留同一套状态、接口调用和弹窗逻辑。需要像属性页一样使用拆分后的文件，并把当前对象页已有行为同步到拆分逻辑中。

## 修改范围

- 将 `ObjectWorkspacePanel.vue` 的分类树弹窗状态和分类接口操作迁移到 `useObjectWorkspaceCategoryActions.ts`。
- 将 `ObjectWorkspacePanel.vue` 的本体对象创建、导入、编辑、删除状态和接口操作迁移到 `useObjectWorkspaceObjectActions.ts`。
- 主面板保留工作区加载、树节点选择与右侧锚点定位、路由跳转和组件组合。
- 保留对象创建接口字段、编辑时 `groupIds: [null]`、删除刷新、父本体无值时不展示等现有行为。
- 更新对象工作区静态检查，确保主面板使用拆分 composable。

## 文件变更

- 修改 `src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`。
- 必要时同步修改 `src/views/OntologySpaceManagementDetail/composables/useObjectWorkspaceCategoryActions.ts` 和 `useObjectWorkspaceObjectActions.ts`。
- 修改或新增对象工作区相关测试文件；不触碰 `html/`、`public/`。

## 实现方式

在主面板创建工作区加载 composable 后，将其 `load`、`workspace` 和 `status` 传入两个操作 composable，并展开返回状态绑定现有弹窗组件。主面板通过 `handleAction` 调用对象操作 composable 的打开方法；分类树事件直接调用分类操作 composable。对象列表继续作为独立展示组件使用。

## 依赖

不新增依赖。

## 验证

- 对任务文件执行 Prettier 格式检查。
- 执行对象工作区相关测试。
- 执行 `npm run type-check`、`npm run build:verify` 和 `git diff --check`。
