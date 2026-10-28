# 关系弹窗分类必填

## 需求理解

空间内关系和对象内关系的新增、编辑弹窗都要给分类加上必填标识，并在未选择时阻止提交。两个页面共用 `SpaceRelationFormDialog`。

## 修改范围

- `src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationFormDialog.vue`
- `tests/ontology-space-relation.test.mjs`
- `tests/update-ontology-link-api.test.mjs`

## 核心实现方式

分类选项存在时，表单项固定 `required`，提交前校验分类 id。没有分类选项时仍不展示该字段。

## 新增依赖

无。

## 验证

先改测试再实现。随后跑关系相关测试、任务文件 `format:check`、`type-check`、`build:verify`。
