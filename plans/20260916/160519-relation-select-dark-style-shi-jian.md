# Plan：本体关系筛选对象下拉框深色样式

确认范围：完善 `el-select` Aircas 公共覆盖，并为关系页筛选对象及同页表单源/目标 select 挂上 `aircas-select` / `aircas-select-popper`。不新增主题变量与依赖。

## 需求理解

关系页筛选对象下拉框未适配系统深色风格；按现有 Element Plus 覆盖规范编写样式并接到控件。

## 修改范围

- 修改 `src/styles/element-plus/el-select.scss`：补齐触发器与下拉面板深色态
- 修改 `SpaceRelationWorkspace.vue` 筛选 `el-select`
- 修改 `SpaceRelationFormDialog.vue` 源端/目标端 `el-select`

## 新增 / 删除文件

无。

## 新增依赖

无。

## 核心实现方式

复用 `--aircas-*` 与现有 `.aircas-select` / `.aircas-select-popper` 约定；触发器对齐 `aircas-input`，面板对齐已有下拉覆盖模式。

## 验证方式

- `npm run check:project-conventions`
- 人工确认筛选下拉默认 / hover / 选中 / 清空深色一致
