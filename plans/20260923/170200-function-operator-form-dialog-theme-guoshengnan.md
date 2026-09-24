# 新建函数算子弹窗改用主题色

## 需求理解

新建 / 编辑函数算子弹窗颜色不符合主题。只给弹窗及其内部参数配置控件补已有公共 class 和有效主题变量，不改公共样式文件。

## 修改范围

- 改 `FunctionOperatorFormDialog.vue` 与弹窗内的 `BasicFilterGroupEditor.vue`。
- 不改 `src/styles/`、详情抽屉、测试弹窗和其他页面。

## 新增、修改和删除文件

- 修改：`src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorFormDialog.vue`
- 修改：`src/views/OntologySpaceManagementDetail/functionOperatorComponents/BasicFilterGroupEditor.vue`
- 修改：`tests/function-operator-workspace.test.mjs`
- 新增依赖：无

## 核心实现方式

弹窗使用 `aircas-dialog`、`aircas-form`、`aircas-empty`。当前 Element Plus 类型不含 `overlay-class`，因此不传该属性。参数配置里的输入框和下拉框使用 `aircas-input`、`aircas-select` 与 `aircas-select-popper`。失效令牌 `--aircas-color-panel-overlay` 改为 `--aircas-color-overlay`。数字输入没有公共覆盖，用本页 scoped 变量套主题输入色。

## 验证方式

先补失败测试断言公共 class 与有效令牌，再改页面并通过函数算子测试。格式检查仅覆盖上述文件。
