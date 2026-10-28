# 对象详情行为页独立工作区

## 需求理解

对象详情的“行为”Tab 不再显示空占位页。页面参照空间行为页的布局与功能独立构建，但不得引用空间行为页的 Vue 文件、composable 或工具文件。

对象页通过既有 `query.spaceId` 获取空间标识；本轮继续使用本地 Mock，行为数据按空间维度展示，不做对象级过滤，不接后端接口，也不改行为调度。

## 修改范围

- 修改 `src/router/modules/workspaceRoutes.ts`。
- 在 `src/views/OntologyObjectDetail/` 新增行为工作区 Vue 组件、私有 composable 和工具。
- 修改 `tests/ontology-space-behavior.test.mjs`。
- 新增本 Plan 文件。

不修改空间行为页 Vue、空间行为页 composable 或工具，不修改正式类型、Mock、接口、依赖、`public/` 或 `html/`。

## 新增、修改和删除文件

- 新增 `src/views/OntologyObjectDetail/behaviorComponents/ObjectBehaviorWorkspace.vue`。
- 新增对象行为分类树、列表、分类表单/删除、行为表单、详情抽屉、状态管理和删除等独立 Vue 组件。
- 新增 `src/views/OntologyObjectDetail/composables/useObjectBehaviorWorkspace.ts`。
- 新增 `src/views/OntologyObjectDetail/utils/objectBehaviorOperations.ts`。
- 修改对象行为子路由，懒加载独立工作区。
- 修改行为页测试，覆盖独立组件与对象页 `query.spaceId` 解析。

## 核心实现方式

1. 独立工作区保持空间行为页的 `360px + 1fr` 布局、分类筛选、关键词和状态筛选、分页，以及创建、查看、编辑、状态管理、删除功能。
2. 对象行为 composable 从 `route.query.spaceId` 读取空间标识，使用现有正式行为类型、Mock 和本地行为操作规则；它不导入空间页面的私有 composable 或工具。
3. 独立组件使用现有 Aircas 主题变量、`aircas-tree`、`aircas-table`、对话框和抽屉样式，完整处理 loading、ready、empty、error 与命令中的重复提交和错误提示。
4. 行为数据继续按空间维度共享本地 Mock；对象行为页不把结果限制到当前对象。

## 新增依赖及必要性

无。

## 验证方式

1. 先增加对象行为页路由、独立工作区和 `query.spaceId` 解析断言，运行定向测试取得失败结果。
2. 实现后运行定向测试、`npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`。
3. 对当前任务文件执行限定 Prettier 格式化与检查。
4. 执行 `git diff --check`，审阅任务相关 diff 和工作区状态。
