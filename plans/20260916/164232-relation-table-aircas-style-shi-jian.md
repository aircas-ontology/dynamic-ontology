# Plan：关系列表 el-table 挂载 Aircas 深色样式

确认范围：关系页列表视图 `el-table` 挂上已有 `aircas-table aircas-table--flat`，与空间管理表格一致。不新增 `el-table.scss`，不新增依赖。

## 需求理解

完善本体空间关系列表表格深色风格协调性。

## 修改范围

- 修改 `SpaceRelationWorkspace.vue`：列表 `el-table` 增加 `aircas-table aircas-table--flat`

## 新增依赖

无。

## 验证方式

- 浏览器切换关系「列表」视图检查深色表头 / 斑马纹 / hover
