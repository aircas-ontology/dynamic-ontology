# 嵌入式隐藏新建对象空间按钮

## 需求理解

对象空间管理通过 `userName` 查询参数嵌入访问时隐藏“新建对象空间”按钮，普通访问继续显示。

## 修改范围

- 对象空间管理页面读取当前路由的 `userName` 查询参数并计算嵌入模式。
- 欢迎面板增加按钮显示控制，嵌入模式不渲染创建按钮。
- 增加源码测试覆盖嵌入和普通访问条件。

## 文件

- 修改 `src/views/OntologySpaceManagement/index.vue`。
- 修改 `src/views/OntologySpaceManagement/components/WelcomePanel.vue`。
- 修改 `tests/ontology-space-management.test.mjs`。

## 核心实现方式

沿用布局层的 `userName` 判定规则，页面通过布尔属性传给欢迎面板，欢迎面板使用 `v-if` 控制“新建对象空间”按钮。

## 依赖

不新增依赖。

## 验证方式

运行空间管理定向测试、相关文件格式检查、类型检查、构建验证和 `git diff --check`。
