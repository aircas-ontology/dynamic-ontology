# 属性分类树计数对齐对象/关系

## 需求理解

属性分类树节点上的数值改为「本节点直属属性 + 全部子孙分类下的属性」，与对象概念树、关系分类树一致。修复根节点「全部」只显示直属数量（如 1）而不含子分类属性总数的问题。

## 修改范围

- 分支：`dev_sthq_1029`
- `src/views/OntologyObjectAttributePanel/utils/attributePanelHelpers.ts` 中 `mapCategoryTreeNode`
- `tests/ontology-object-attribute-panel.test.mjs` 增加行为测试

## 新增、修改和删除文件

- 修改：`attributePanelHelpers.ts`
- 修改：`ontology-object-attribute-panel.test.mjs`
- 新增：本 Plan 文件
- 无删除；无新依赖

## 核心实现方式

在 `mapCategoryTreeNode` 中：

- `ownPropertyCount = propertyInfos` 映射后的长度
- `descendantPropertyCount = sum(categoryChildren.propertyCount)`
- `propertyCount = ownPropertyCount + descendantPropertyCount`

对齐 `mapOntologyCategoryTree` 的 `own + descendant` 语义。

## 新增依赖及必要性

无。

## 验证方式

- TDD：先写失败测试再实现
- `npm test`
- `npm run test:coverage`
- `npm run type-check`
- `npm run build:verify`
- `npm run format:check -- <修改文件列表>`
