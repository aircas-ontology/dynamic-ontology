# 行为调度 Tab 展示 actionSchedulingCount

## 需求理解

空间浏览 Tab「行为调度」当前角标为「—」，需展示统计数值；字段为概览/空间统计接口中的 `actionSchedulingCount`（与管理侧 `useSpaceOverview` 一致）。列表分页 total 不另作角标来源。

## 修改范围

实体浏览统计映射与 `EntityBrowsing` 角标组装；不改管理侧。

## 新增、修改和删除文件

- 修改：`src/views/EntityBrowsing/utils/browseStatistics.ts`
- 修改：`src/views/EntityBrowsing/index.vue`
- 修改相关测试：`tests/entity-browsing-statistics.test.mjs` 等
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. `BrowseStatistics` 增加 `actionScheduling`，从 `statistic.actionSchedulingCount` 归一化写入。
2. `spaceOverviewCounts` 在 overview success 时增加 `"behavior-schedule": counts.value.actionScheduling`。
3. loading 仍走 `overviewStatus === "loading"`。

## 新增依赖及必要性

- 无

## 验证方式

- 相关 `npm test`；`format:check`；`type-check` / `build:verify`
