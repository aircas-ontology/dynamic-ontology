# Plan：行为删除后同步分类树与统计

## 需求理解

删除行为成功后，同步更新左侧行为分类树与顶部 tab「行为 N」统计。

## 修改范围

1. `deleteBehavior` 成功后重载工作区（分类树 + 列表）。
2. 布局层 provide 统计刷新；行为工作区删除成功后 inject 调用。
3. 统计刷新支持 `keepPrevious`，避免数字闪空。
4. 更新相关测试。

## 新增、修改和删除文件

- 新增：`src/composables/shared/useSpaceOverviewRefresh.ts`（InjectionKey）
- 修改：`useSpaceBehaviorWorkspace.ts`、`OntologySpaceManagementDetail/index.vue`、`useSpaceOverview.ts`
- 修改：相关测试

## 核心实现方式

- 删除成功：`await loadSpaceBehaviorWorkspace()`，再调用注入的 overview refresh（`keepPrevious: true`）。
- 布局：`provide(SPACE_OVERVIEW_REFRESH_KEY, …)`。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测
- `format:check` 任务文件
