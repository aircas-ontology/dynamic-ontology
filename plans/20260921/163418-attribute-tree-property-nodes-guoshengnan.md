# 属性分类树展示属性树叶节点

## 需求理解

属性分类树的每个分类节点下展示其已归类属性，并按树叶节点样式显示属性名称，保留现有分类选择、创建、编辑和删除功能。

## 修改范围

- 修改属性分类树节点模板和组件私有样式，增加属性树叶行。
- 扩展属性分类树接口类型和 Mock，接收分类节点的 `propertyInfos` 属性信息。
- 直接使用分类树接口返回的属性信息作为树叶数据源。
- 更新属性页面及接口契约测试，覆盖属性树叶节点展示和 `propertyInfos` 映射。

## 新增、修改和删除文件

- 修改 `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`。
- 修改 `src/types/apis/getOntologyObjectArrTypeTreeType.ts`。
- 修改 `src/mocks/getOntologyObjectArrTypeTreeMock/getOntologyObjectArrTypeTreeMock.ts`。
- 修改 `tests/ontology-object-attribute-panel.test.mjs`。
- 修改 `tests/get-ontology-object-arr-type-tree-api.test.mjs`。
- 新增本 Plan 文件。

## 核心实现方式

为分类节点增加分类内容区域，在其下按当前主题树叶样式渲染 `propertyInfos` 中的属性名称。用户选择分类时右侧列表仍使用原有按分类查询接口，分类树刷新时直接使用接口返回的最新属性信息。

## 新增依赖及必要性

无。

## 验证方式

- 先运行属性页测试确认新增断言失败。
- 完成最小实现后运行属性页及属性接口相关测试。
- 对任务文件执行 Prettier 格式化和格式检查。
- 执行 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify` 和 `git diff --check`。
