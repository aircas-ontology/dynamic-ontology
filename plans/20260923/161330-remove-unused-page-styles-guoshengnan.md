# 删除页面未使用的 style 规则

## 需求理解

检查各页面 `<style>` 中的选择器，删除模板和脚本都不再引用的规则。动态 class、`:deep()` 子组件/Element Plus 类、以及画布注入的 HTML class 一律保留。

## 修改范围

- 全站 `src/views` 页面样式已扫描。
- 确认未使用：`OntologyConceptualModelCreate/index.vue` 中的 `.conceptual-model-create__space-input`（输入框已不带该类，样式在 `ConceptualModelTopbar.vue`）。
- 不删动态修饰符、`:deep(.el-*)`、X6 节点 class。
- 不删未挂载的拆分组件（其自身模板仍使用这些样式）。
- 不改主题文件、`el-button.scss`、布局和交互。

## 新增、修改和删除文件

- 修改：`src/views/OntologyConceptualModelCreate/index.vue`
- 新增/删除文件：无
- 新增依赖：无

## 核心实现方式

删除该文件中基础态和 `@media (max-width: 720px)` 里的两段 `__space-input` 规则。

## 验证方式

概念模型页面现有测试；格式检查仅覆盖该文件。
