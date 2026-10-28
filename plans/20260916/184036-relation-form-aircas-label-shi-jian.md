# Plan：关系表单挂载 aircas-form 修复深色 label

确认范围：`SpaceRelationFormDialog` 的 `el-form` 挂上已有公共类 `aircas-form`，复用 `el-form.scss`，不新建样式文件、不改主题 token。

## 需求理解

编辑/添加关系弹窗 label 在深色模式下看不清。

## 修改范围

- 修改 `SpaceRelationFormDialog.vue`：`<el-form class="aircas-form" …>`

## 新增依赖

无。

## 验证方式

浏览器打开添加/编辑关系弹窗，确认 label 使用 `--aircas-color-text-secondary` 且可读。
