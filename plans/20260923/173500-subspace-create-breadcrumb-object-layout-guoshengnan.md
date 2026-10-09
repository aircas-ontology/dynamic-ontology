# 子空间创建面包屑与对象页左右布局

## 需求理解

面包屑在空间名后增加「创建子空间」。左右分栏对齐空间内管理对象页：左分类体系树、右内容区，使用对象页同一套分栏宽度、间距和面板样式。

## 修改范围

- 面包屑在 `OntologySubspaceCreate` 增加第三级文案，空间名可回空间详情。
- 子空间创建页左右布局和左右面板外观对齐对象工作区。
- 不改公共主题、对象页实现和其他路由。

## 新增、修改和删除文件

- 修改：`src/layout/components/BreadcrumbBar.vue`
- 修改：`src/views/OntologySubspaceCreate/index.vue`
- 修改：`src/views/OntologySubspaceCreate/components/SubspaceCreateTreePanel.vue`
- 修改：`src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue`
- 修改：`tests/layout-navigation.test.mjs`
- 修改：`tests/ontology-subspace-create.test.mjs`
- 新增依赖：无

## 核心实现方式

1. 面包屑在空间详情判断前识别 `OntologySubspaceCreate`，渲染「本体空间管理 / 空间名 / 创建子空间」，标题取路由 `meta.title`。
2. 页面网格改为 `320px` + `8px` 间距，窄屏规则对齐对象工作区。
3. 左栏复用概念层级树面板边框、渐变和内阴影；右栏顶栏复用对象列表工具条样式，内容区可滚动。

## 验证方式

先补失败测试断言面包屑和对象页布局令牌，再改实现并通过相关测试。格式检查仅覆盖本任务文件。
