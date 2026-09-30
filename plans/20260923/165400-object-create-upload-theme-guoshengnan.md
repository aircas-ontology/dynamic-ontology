# 新建本体导入上传区改用主题色

## 需求理解

对象列表「新建本体」导入创建里的文件上传区颜色不符合主题。只改该弹窗局部样式，不改公共主题和 `el-upload` 覆盖。

## 修改范围

- 只改 `OntologyObjectCreateDialog.vue` 导入拖拽上传及其局部样式。
- 不改 `src/styles/`、主题文件、图标选择上传和其他页面。

## 新增、修改和删除文件

- 修改：`src/views/OntologySpaceManagementDetail/components/OntologyObjectCreateDialog.vue`
- 修改：`tests/ontology-object-create-dialog.test.mjs`
- 新增依赖：无

## 核心实现方式

导入 `el-upload` 增加已有 `aircas-upload` class。拖拽层用页面 scoped `:deep(.el-upload-dragger)` 套主题边框、背景、图标和 hover / dragover 色，因为公共覆盖的 `&.el-upload-dragger` 挂不到内部拖拽节点。

## 验证方式

先补失败测试断言上传 class 与局部拖拽层主题变量，再改页面并通过创建弹窗测试。格式检查仅覆盖上述文件。
