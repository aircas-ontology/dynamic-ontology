# 本体对象属性面板拆分子组件与 composable

## 需求理解

将 `OntologyObjectAttributePanel.vue`（约 940 行）拆成页面私有子组件（优先弹窗），并把分类树、属性列表与表单交互抽到页面级 composable；行为、接口调用与文案保持不变。

## 修改范围

- `src/views/OntologyObjectDetail/components/`：入口编排与子组件
- `src/views/OntologyObjectDetail/composables/`：分类树与属性列表逻辑
- `src/views/OntologyObjectDetail/utils/`：纯函数 helpers
- `src/types/pages/ontologyObjectDetailType.ts` 及 `@/types` 导出
- 相关源码断言测试文件

## 新增、修改和删除文件

新增：

- `src/views/OntologyObjectDetail/utils/attributePanelHelpers.ts`
- `src/views/OntologyObjectDetail/composables/useAttributeCategoryTree.ts`
- `src/views/OntologyObjectDetail/composables/useAttributePropertyList.ts`
- `src/views/OntologyObjectDetail/components/AttributeCategoryTree.vue`
- `src/views/OntologyObjectDetail/components/AttributePropertyTable.vue`
- `src/views/OntologyObjectDetail/components/AttributeCategoryCreateDialog.vue`
- `src/views/OntologyObjectDetail/components/AttributeCategoryEditDialog.vue`
- `src/views/OntologyObjectDetail/components/AttributePropertyFormDialog.vue`

修改：

- `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`
- `src/types/pages/ontologyObjectDetailType.ts`
- `src/types/index.ts`
- `tests/ontology-object-attribute-panel.test.mjs`
- `tests/ontology-property-api.test.mjs`
- `tests/get-ontology-object-arr-type-tree-api.test.mjs`

删除：无

## 核心实现方式

1. 页面类型并入 `ontologyObjectDetailType.ts` 并转导出。
2. 树查找、扁平化、字段映射等纯函数放入 `attributePanelHelpers.ts`。
3. `useAttributeCategoryTree` 负责分类树加载与创建/编辑/删除分类。
4. `useAttributePropertyList` 负责属性列表加载与添加/编辑/删除属性表单。
5. 三个 Dialog 与树、表展示组件只负责 UI；入口面板组合子组件并共享 `selectedCategoryId`。

## 新增依赖及必要性

无。

## 验证方式

- 更新并运行上述三个相关测试
- `npm run type-check`
- `npm run check:types-conventions`
- `npm run format:check -- <任务文件列表>`
- `npm run build:verify`
