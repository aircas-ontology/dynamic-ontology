# 概念模型创建页拆分子组件与 composable

## 需求理解

将 `OntologyConceptualModelCreate/index.vue`（约 800+ 行）拆成页面私有子组件，并把状态与交互抽到页面级 composable；行为、文案与交互保持不变，不新增接口或依赖。

## 修改范围

- `src/views/OntologyConceptualModelCreate/`：入口编排、components、composables、utils
- `src/types/pages/ontologyConceptualModelCreateType.ts` 及 `@/types` 导出
- `tests/ontology-conceptual-model-create.test.mjs`：改为断言拆分后的结构

## 新增 / 修改 / 删除文件

新增：

- `src/types/pages/ontologyConceptualModelCreateType.ts`
- `src/views/OntologyConceptualModelCreate/utils/conceptualModelGeometry.ts`
- `src/views/OntologyConceptualModelCreate/composables/useConceptualModelCanvas.ts`
- `src/views/OntologyConceptualModelCreate/components/ConceptualModelTopbar.vue`
- `src/views/OntologyConceptualModelCreate/components/ConceptualModelPalette.vue`
- `src/views/OntologyConceptualModelCreate/components/ConceptualModelCanvas.vue`
- `src/views/OntologyConceptualModelCreate/components/ConceptualModelInspector.vue`

修改：

- `src/views/OntologyConceptualModelCreate/index.vue`
- `src/types/index.ts`
- `tests/ontology-conceptual-model-create.test.mjs`

删除：无

## 核心实现方式

1. 页面类型迁入 `ontologyConceptualModelCreateType.ts` 并从 `src/types/index.ts` 转导出。
2. `objectPoint` / `pointFor` 抽到 `utils/conceptualModelGeometry.ts`。
3. 画布状态、选择、拖拽、增删改、缩放、保存提示与返回封装为 `useConceptualModelCanvas`。
4. 顶栏、组件库、画布、检查器拆为四个页面私有组件；`index.vue` 仅负责布局与组合。
5. 样式随组件拆分；页面级布局样式留在 `index.vue`。

## 新增依赖及必要性

无。

## 验证方式

- 更新并运行 `tests/ontology-conceptual-model-create.test.mjs`
- `npm run type-check`
- `npm run check:types-conventions`
- `npm run format:check -- <任务文件列表>`
- `npm run build:verify`
