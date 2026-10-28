# 对象空间管理表格展示指标数量

## 需求理解

对象空间管理卡片视图已展示每条空间的 `metrics`（对象 / 行为 / 关系 / 规则），表格视图缺少对应列。需在「描述」与「创建时间」之间补齐四列，与主题管理表格改动一致。

## 修改范围

- 修改：`src/views/OntologySpaceManagement/components/SpaceTableView.vue`
- 不新增 / 删除文件
- 无新增依赖

## 核心实现方式

在 `SpaceTableView` 的 `el-table` 中，于描述列之后插入对象 / 行为 / 关系 / 规则四列，通过已有 `spaceRow(row).metrics` 取值，与卡片网格一致。

## 新增依赖及必要性

无。

## 验证方式

- 人工切换表格视图核对四列与同条卡片数值一致。
- `npm run format:check -- src/views/OntologySpaceManagement/components/SpaceTableView.vue`
- `npm run type-check`（区分既有失败与本次新增失败）
