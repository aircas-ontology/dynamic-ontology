# 关联数据源弹窗布局实现

## 需求理解

按原型 `http://localhost:36001/#/layout/ontology-space-management/navy/carrier-ford` 属性页"关联数据源"按钮打开的弹窗，在本项目实现同款布局组件，入口为本体对象属性页 `OntologyObjectAttributePanel.vue` 的"关联数据源"按钮。本轮只做**页面布局**，不含真实接口对接、关联逻辑、连线图、自动关联、跳转数据管道等业务能力。

用户已确认由本任务同时承担按钮接线，与在途的"概念画布创建接口对接"任务在 `OntologyObjectAttributePanel.vue` 上可能产生合并冲突，由用户协调。

## 修改范围

- 新增 `src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue`：弹窗组件，含头部、顶部工具栏、左中右三列主体。
- 修改 `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`：仅把 `openDataSource` 改为打开新弹窗，新增一个 visible ref 与弹窗实例。
- 新增 `tests/data-source-associate-dialog.test.mjs`：结构渲染测试。
- 不动 `src/types/index.ts` barrel、`src/apis/`、`src/mocks/`，避免与在途 API 任务冲突；类型在组件内本地定义。
- 不新增依赖，不修改 `html/`、`public/`、`vite.config.ts`、`tsconfig*.json`。

## 文件

新增：

- `src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue`
- `tests/data-source-associate-dialog.test.mjs`
- `plans/20260921/103020-data-source-associate-dialog-guoshengnan.md`

修改：

- `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`

## 核心实现方式

- 基于 `el-dialog` + `aircas-dialog`，宽度 `min(1100px, 96vw)`，`append-to-body` + `destroy-on-close`。
- 头部用 el-dialog title "关联数据源"。
- 顶部工具栏：已选数据表 tab（带关闭×、+N 计数）｜"选择数据表"下拉｜"选择字段"标签｜"关联到"｜"选择本体属性"下拉｜"关联"按钮（无选中时 disabled）｜"自动关联数据源"按钮｜"跳转到数据管道"按钮（默认 disabled）。
- 主体用 CSS Grid 三列：左 `minmax(280px, 32%)`、中 `minmax(0, 1fr)`、右 `minmax(220px, 22%)`，窄屏改单列堆叠。
- 左面板：按数据表分组的字段列表，每组用本地 `collapsedTables` ref 控制折叠，列头「字段名称｜数据类型」，每行末尾「关联字段」按钮。
- 中间区：本体属性列表，列头「名称｜API 名称｜分类」，每行开头「关联属性」按钮，apiName 作为行唯一标识。
- 右面板：操作缓存，显示「操作缓存｜N 项待提交」、提示「图中双击连线可临时删除，提交后保存。」、「已关联 18 / 23」、「提交」按钮（缓存为空时 disabled）。
- 类型本地定义：`DataSourceTable`、`DataSourceField`、`OntologyAttributeItem`。
- mock 数据内联：7 张数据源表 + 23 条本体属性，与原型一致。
- 接线：`OntologyObjectAttributePanel.vue` 新增 `dataSourceDialogVisible` ref，`openDataSource` 改为置 true，模板末尾挂载 `<DataSourceAssociateDialog v-model="dataSourceDialogVisible" />`。

## 新增依赖及必要性

无新增依赖。复用 Element Plus `el-dialog`/`el-select`/`el-button`/`el-icon` 与 `@element-plus/icons-vue` 现有图标。

## 验证

```sh
npm test -- tests/data-source-associate-dialog.test.mjs
npm run type-check
npm run build:verify
npm run format:check -- src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue tests/data-source-associate-dialog.test.mjs
git diff --check
git status --short
```

浏览器实机验证：访问本体对象属性页，点击"关联数据源"按钮，确认弹窗结构与原型一致。

## 风险与边界

- `OntologyObjectAttributePanel.vue` 与在途 API 任务共用，可能产生合并冲突，由用户协调。
- 不实现真实关联逻辑、连线图、自动关联、跳转数据管道，这些属于后续接口对接任务。
- 弹窗的"关联"/"提交"/"自动关联"等交互仅做到按钮 disabled 状态切换与折叠/选中视觉态，不与后端交互。
