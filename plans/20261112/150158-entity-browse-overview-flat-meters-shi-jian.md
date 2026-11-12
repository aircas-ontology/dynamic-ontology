# 实体浏览概览五卡并排

## 需求理解

去掉「统计信息 / 质量情况」两组外层边框与分组，五个指标卡片同一行并排；单卡边框保留。隐藏标准内容时只展示统计卡。

## 修改范围

`EntityBrowseOverview.vue` 模板与样式；必要时更新 `entity-browsing-statistics` 单测。

## 新增、修改和删除文件

| 操作     | 路径                                                           |
| -------- | -------------------------------------------------------------- |
| 修改     | `src/views/EntityBrowsing/components/EntityBrowseOverview.vue` |
| 可能修改 | `tests/entity-browsing-statistics.test.mjs`                    |

## 核心实现方式

去掉 `__group` 容器；统计与质量卡片放入同一 `__stats` grid；移除 group 边框/分组背景；保留 meter 卡片样式。

## 新增依赖及必要性

无。

## 验证方式

`node --test tests/entity-browsing-statistics.test.mjs`；任务文件 format；`type-check`、`build:verify`。
