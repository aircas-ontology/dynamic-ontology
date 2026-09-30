# 公共加载动画计划

## 需求理解

在现有加载文案上方增加统一的加载动画，原文案保持不变。按钮的 `:loading` 和 `el-loading` 遮罩已有转圈，不在本次范围内。

## 修改范围

- 新增全局组件 `AircasLoading`，默认插槽放置原有文案，插槽上方为 CSS 圆环动画。
- 接入本体空间列表、空间详情、对象工作区、关系工作区、空间总览和属性分类/属性表格的现有加载文案。
- 不改错误态、空态和按钮提交中的 loading。

## 文件变更

新增：

- `src/components/AircasLoading.vue`
- `tests/aircas-loading.test.mjs`

修改：

- `src/components/register.ts`
- `src/views/OntologySpaceManagement/index.vue`
- `src/views/OntologySpaceManagementDetail/index.vue`
- `src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`
- `src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue`
- `src/views/OntologySpaceManagementDetail/components/SpaceOverviewPanel.vue`
- `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`

## 核心实现方式

- 组件根节点为 `span`，内部纵向排列，动画节点在文案之前并标记 `aria-hidden`。
- 圆环颜色使用现有 `--aircas-color-title` 与 `--aircas-color-accent-cyan-soft`，不新增主题变量。
- `prefers-reduced-motion: reduce` 时停止旋转。
- 在 `register.ts` 按组件名字典序全局注册，并在各使用处显式导入，以便类型检查识别组件。外层容器继续负责居中、最小高度和 `role="status"`。

## 依赖

不新增依赖。

## 验证方式

先运行失败测试，再完成最小实现。执行 `node --test --experimental-strip-types tests/aircas-loading.test.mjs`、`npm run type-check` 和任务文件的 `npm run format:check`。在浏览器中查看本体空间列表的加载状态。
