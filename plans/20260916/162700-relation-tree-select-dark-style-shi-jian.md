# Plan：添加关系弹窗 el-tree-select 深色样式

确认范围：新增 `el-tree-select.scss` Aircas 公共覆盖，并在 `SpaceRelationFormDialog` 分类树选择挂上 `aircas-tree-select` / `aircas-tree-select-popper`。不新增主题变量与依赖。

## 需求理解

完善本体空间添加关系中的 `el-tree-select` 深色风格，规范与其他 Element Plus 覆盖文件一致。

## 修改范围

- 新增 `src/styles/element-plus/el-tree-select.scss`
- 修改 `src/styles/index.scss` 聚合引入
- 修改 `SpaceRelationFormDialog.vue` 挂 class / popper-class

## 新增依赖

无。

## 核心实现方式

触发器对齐 `aircas-select`；下拉面板复用菜单背景与树节点 hover/current 态，仅用现有 `--aircas-*`。

## 验证方式

- `npm run check:project-conventions`
- 浏览器确认添加关系弹窗分类树选择深色协调
