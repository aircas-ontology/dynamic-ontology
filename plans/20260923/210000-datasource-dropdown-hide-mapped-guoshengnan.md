# 关联下拉过滤已关联字段

## 需求理解

属性关联数据源弹窗顶部「关联数据源字段」和「关联本体字段」下拉，不展示当前草稿里已经连上的字段和属性。取消连线后重新可选。

## 修改范围

- `src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue`
- `tests/data-source-associate-dialog.test.mjs`

## 核心实现方式

字段选项按当前表过滤 `draftBinds` 中已占用的字段。本体属性选项过滤已有关联的属性。当前选中项若已不再可选则清空。

## 新增依赖

无。

## 验证

先更新测试再实现。随后跑关联弹窗测试、任务文件 `format:check`、`type-check`、`build:verify`。
