# 主题管理表格展示指标数量

## 需求理解

主题管理卡片视图已展示每条主题的 `metrics`（对象 / 行为 / 关系 / 规则），表格视图目前只有：空间名称、描述、创建时间、更新时间、操作。需在表格中补齐与卡片一致的四列数量，位置在「描述」与「创建时间」之间。

## 修改范围

仅改展示层，不改数据加载、接口、类型、Mock。

- 修改：`src/views/ThemeSpaceManagement/index.vue`
- 不新增 / 删除文件
- 无新增依赖

## 核心实现方式

在现有 `el-table` 中，于描述列之后、创建时间列之前插入四列，数据源与卡片一致：`row.metrics.ontology` / `behavior` / `relation` / `rule`。列文案与卡片 `dl` 一致（对象 / 行为 / 关系 / 规则）。

## 新增依赖及必要性

无。

## 验证方式

- 无法合理做自动化 UI 行为测试（纯表格列展示）；人工切换表格视图核对四列与同条卡片数值一致。
- `npm run format:check -- src/views/ThemeSpaceManagement/index.vue`
- 涉及 Vue 源码：`npm run type-check`
