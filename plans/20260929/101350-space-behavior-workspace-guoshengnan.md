# 空间内行为页面

## 需求理解

按原型实现空间内行为页。左侧行为分类树与对象概念层级树视觉一致；右侧列表与关系列表使用同一套 `aircas-table aircas-table--flat` 皮肤。本轮不接后端接口，使用页面 Mock。不改对象详情行为 Tab、行为调度 Tab。

## 修改范围

仅替换空间详情「行为」子路由占位页，在 `OntologySpaceManagementDetail` 下新增行为工作区组件、composable、类型和 Mock。

## 新增、修改和删除文件

- 新增 `src/views/OntologySpaceManagementDetail/behaviorComponents/` 下工作区、分类树、列表与弹窗组件
- 新增 `src/views/OntologySpaceManagementDetail/composables/useSpaceBehaviorWorkspace.ts`
- 新增 `src/types/pages/ontologySpaceBehaviorType.ts` 并从 `@/types` 导出
- 新增 `src/mocks/ontologySpaceBehaviorMock/ontologySpaceBehaviorMock.ts`
- 新增 `tests/ontology-space-behavior.test.mjs`
- 修改 `src/router/modules/workspaceRoutes.ts`
- 按需小幅扩展 `src/styles/element-plus/el-tree.scss` 的 `.aircas-tree`

## 核心实现方式

工作区 `360px + 1fr` 布局。分类树使用 `aircas-tree`，仅分类节点，点击筛选列表。列表使用 `aircas-table aircas-table--flat` 与 `stripe`，工具栏提供关键字、状态、查询、重置和新建行为。操作含查看、编辑和更多（删除）。分类与行为增删改走本地 Mock。

## 新增依赖及必要性

无。

## 验证方式

- TDD：先补路由、公共类和列契约测试并确认失败，再实现。
- 运行行为页测试、`npm test`、`npm run test:coverage`、`format:check`、`npm run check:types-conventions`、`type-check`、`build:verify`。
