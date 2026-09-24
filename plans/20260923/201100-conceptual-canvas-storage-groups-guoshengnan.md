# 概念画布按存储分组展示属性

## 需求理解

概念模型画布上的属性按存储分组展示。新建对象在没有属性时也显示 `main` 分组。属性设置勾选主键或名称键后，画布属性名称后分别追加 `（主）`、`（名）`。

## 修改范围

- `src/views/OntologyConceptualModelCreate/utils/groupConceptualAttributes.ts`：分组、键标识与节点高度。
- `src/views/OntologyConceptualModelCreate/utils/conceptualModelGraph.ts`：节点 HTML 按分组渲染。
- `src/views/OntologyConceptualModelCreate/components/ConceptualModelGraphCanvas.vue`：按属性列表计算高度，补充分组标题样式。
- `tests/ontology-conceptual-model-create.test.mjs`：分组顺序、默认 `main`、键标识。

不改检查器、保存字段，以及未接入页面的旧画布。

## 核心实现方式

空分组按 `main`。`main` 排在最前，其余分组按属性首次出现顺序。无属性时只渲染空的 `main` 分组和原空提示。节点高度计入分组标题行。

## 新增依赖

无。

## 验证

先写失败测试再实现。随后跑概念模型测试、任务文件 `format:check`、`type-check`、`build:verify`。
