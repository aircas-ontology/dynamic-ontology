# 属性分类树点击属性即编辑

## 需求理解

在本体对象详情「属性」页左侧属性分类树中，点击某个属性节点时，直接打开属性编辑弹窗并回显该属性，行为与右侧属性表「编辑」按钮一致。点击分类节点的现有筛选行为保持不变。

## 修改范围

仅改本体对象详情属性面板编排与树事件透出；不改接口、类型定义、弹窗表单本身。工作区中概念构建画布去掉 `<<object>>` 的既有修改不纳入本次范围。

## 新增、修改和删除文件

- 修改 `src/views/OntologyObjectDetail/components/AttributeCategoryTree.vue`
- 修改 `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`
- 修改 `tests/ontology-object-attribute-panel.test.mjs`
- 新增本 Plan 文件

## 核心实现方式

1. 树组件 `node-click` 按节点类型分流：分类节点继续 emit `select-category`；属性节点新增 emit `edit-attribute`，载荷为属性节点。
2. 面板监听 `@edit-attribute`，用已有 `mapOntologyPropertyItem(data.source, objectId)` 转成 `OntologyAttributeItem`，再调用 `openEditAttribute(...)`。
3. 分类点击仍走 `selectCategory`，不打开编辑弹窗；不改分类选中与列表刷新逻辑。

## 新增依赖及必要性

无。

## 验证方式

- TDD：先补测试断言（树 emit `edit-attribute`、面板把属性节点接到 `openEditAttribute` / `mapOntologyPropertyItem`），确认失败后再实现。
- `npm test`、`npm run test:coverage`
- 对改动文件执行 `npm run format:check -- <文件列表>`
- `npm run type-check`、`npm run build:verify`
- 手动：打开本体对象属性页 → 点分类树中属性节点 → 应弹出「编辑属性」并回显正确字段；点分类节点仍只刷新右侧列表
