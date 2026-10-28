# 空间内行为弹窗布局对齐原型

## 需求理解

按 `localhost:36001` 原型对齐空间内行为页创建、查看、编辑、删除弹层的布局骨架。本轮仍走本地 Mock，不接后端。不改状态管理弹窗、对象详情行为 Tab、对象行为复用方案。

本轮对齐骨架和展示列，不移植原型完整参数绑定编辑器、关系绑定、函数行为类型。

## 修改范围

创建/编辑改为单栏纵向分区：顶部导语与状态 Tag、`el-alert` 另存副本/停用只读、基本信息两列网格、基础操作与算子同一行下拉、自定义参数表、变更信息。查看抽屉按原型头部、摘要字段、变更条和时间轴重排。删除弹窗补预检区与名称确认表单项。基础操作保留现有四项（含查询）。

## 新增、修改和删除文件

- 改 `BehaviorFormDialog.vue`、`BehaviorDetailDrawer.vue`、`BehaviorDeleteDialog.vue`、`SpaceBehaviorWorkspace.vue`
- 改 `ontologySpaceBehaviorType.ts`、Mock、`spaceBehaviorOperations.ts`、`tests/ontology-space-behavior.test.mjs`

## 核心实现方式

继续用 `aircas-dialog` / `aircas-drawer` 和现有 token。参数表展示 Mock 的 `sourceLabel`、`bindLabel`、`configured`。删除预检 Mock 固定无引用、可删。已发布编辑只另存草稿副本；已停用编辑只读。

## 新增依赖及必要性

无。

## 验证方式

先补失败测试，再最小实现。跑行为页测试、`format:check`、`check:types-conventions`、`type-check`、`build:verify`。
