# 样式规范整改

## 需求理解

按 `src/styles/readme.md`、页面与组件规范，以及 Aircas UI 技能的扫描结果，只整改已经确认的规范缺口。硬编码颜色、BEM 拼接和暗亮主题令牌成对定义保持现状。

## 修改范围

- 两处未加 `scoped` 的私有样式改为符合规范的写法，颜色继续使用现有 `--aircas-*` 变量。
- 脱离组件 DOM 的选择器、日期选择器和提示浮层补上已有 `popper-class`。
- 不改 `:deep()` 内部节点选择器，不调整字号和间距，不新增主题变量，不改 `public/` 与 `html/`。

## 新增、修改和删除文件

- 修改 `src/views/OntologyConceptualModelCreate/components/ConceptualModelGraphCanvas.vue`
- 修改 `src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue`
- 修改 `src/views/OntologyConceptualModelCreate/index.vue`
- 修改 `src/views/OntologyConceptualModelCreate/components/ConceptualModelInspector.vue`
- 修改 `src/views/OntologyLlmBuilder/index.vue`
- 修改 `src/components/AircasTimeline.vue`
- 修改 `src/views/OntologyObjectDetail/components/AttributeCategoryTree.vue`
- 修改 `src/views/OntologySpaceManagementDetail/components/ConceptHierarchyTree.vue`
- 修改 `src/views/OntologySpaceManagementDetail/relationComponents/RelationCategoryPanel.vue`
- 修改 `src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue`
- 不新增、不删除文件

## 核心实现方式

- `ConceptualModelGraphCanvas.vue` 后半段节点样式目前没有 `scoped`，因为 X6 把 HTML 插在组件模板之外。改为带 `scoped` 的样式，并用稳定的画布容器类限制选择器；颜色仍用现有变量。
- `DataSourceAssociateDialog.vue` 末尾 `.property-datasource-mapping-dialog` 目前是全局样式。改为通过对话框公开类名挂到已有 Element Plus 对话框覆盖上，或改为组件内 `scoped` 样式，不再把页面类名留在全局。
- `el-select` 增加 `popper-class="aircas-select-popper"`，并保留已有 `aircas-select` 或 `aircas-input` 类名。涉及概念模型页 4 处、`ConceptualModelInspector.vue` 3 处、`OntologyLlmBuilder/index.vue` 3 处。
- `AircasTimeline.vue` 的 `el-date-picker` 增加对应日期浮层 `popper-class`。
- 属性分类树、概念层级树、关系分类树和关系工作区里的图标 `el-tooltip` 增加 `popper-class="aircas-popper"`。提示文案和按钮行为不变。

## 新增依赖

- 无

## 验证方式

- 对上述文件执行格式检查。
- 打开概念模型、属性分类、关系分类、大模型构建、数据源关联弹窗和时间轴，确认下拉、提示和对话框外观仍使用现有主题，且没有把样式泄漏到其他页面。
