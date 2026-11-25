# 空间浏览添加行为调度 Tab

## 需求理解

空间浏览在「行为」旁增加「行为调度」Tab。内容与行为管理中的行为调度页一致，但无新建调度、删除调度、编辑；保留筛选/查询/重置、查看、调用日志等。状态开关属于变更操作，一并隐藏。

## 修改范围

路由与 Tab 露出；调度工作区按 `route.meta.browseOnly` 裁剪写操作。不新建独立浏览页副本。

## 新增、修改和删除文件

- 修改：`src/router/modules/workspaceRoutes.ts`
- 修改：`src/views/EntityBrowsing/utils/workspaceTabs.ts`
- 修改：`src/views/EntityBrowsing/components/WorkspaceTypeTabs.vue`
- 修改：`src/views/SpaceBehaviorScheduleWorkspace/index.vue`
- 修改测试：`tests/entity-browsing-merge.test.mjs`、调度相关源码断言
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. `EntityBrowsingBehaviorSchedule` 挂载 `SpaceBehaviorScheduleWorkspace`，`browseOnly: true`。
2. `AVAILABLE_ENTITY_BROWSING_TABS` 与浏览侧 `WorkspaceTypeTabs` 加入「行为调度」。
3. 调度页按 `browseOnly` 隐藏新建/编辑/删除/状态开关；保留查看与调用日志。
4. 管理侧不加 `browseOnly`，行为不变。

## 新增依赖及必要性

- 无

## 验证方式

- 相关 `npm test`；`format:check`；`type-check` / `build:verify`
