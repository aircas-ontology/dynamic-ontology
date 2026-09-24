# 函数算子详情抽屉改用主题色

## 需求理解

函数算子页点击卡片或行后，右侧详情抽屉颜色不符合主题。只给该抽屉及其内部描述、标签补已有公共 class，不改公共样式文件。

## 修改范围

- 只改 `FunctionOperatorDetailDrawer.vue`。
- 不改 `src/styles/`、新建弹窗、测试弹窗和其他页面。

## 新增、修改和删除文件

- 修改：`src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorDetailDrawer.vue`
- 修改：`tests/function-operator-workspace.test.mjs`
- 新增依赖：无

## 核心实现方式

抽屉使用 `class="aircas-drawer function-operator-detail"`。描述列表使用 `aircas-descriptions`。三个 `el-tag` 使用 `aircas-tag`。表格和按钮已有公共 class，不改业务逻辑。

## 验证方式

先补失败测试断言抽屉、描述和标签的公共 class，再改页面并通过函数算子测试。格式检查仅覆盖上述文件。
