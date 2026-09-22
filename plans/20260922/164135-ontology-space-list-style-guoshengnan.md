# 本体空间管理列表样式对照截图

## 需求理解

对照用户提供的本体空间管理列表截图，仅调整展示与控件外观；不接入「创建用户」「今日新增」「迷你折线图」等当前接口/类型中不存在的数据。

欢迎区用户名仍显示「访客」，用强调色；新建按钮改为实心主按钮。工具栏说明随表格/卡片视图变化；名称排序改为下拉；视图切换改为网格在左、列表在右。表格减弱渐变发光、缩小名称列缩略图；行操作按钮统一为描边主按钮。

## 修改范围

- 仅 `src/views/OntologySpaceManagement/` 页面私有组件。
- 不修改全局主题、不新增主题变量、不新增依赖。
- 不触碰 `public/`、`html/`。
- 保留工作区中与本次无关的已有修改。

## 新增、修改和删除文件

- 新增：本 Plan。
- 修改：`WelcomePanel.vue`、`SectionToolbar.vue`、`SpaceTableView.vue`、`SpaceActions.vue`。
- 修改：`tests/ontology-space-management-structure.test.mjs`（结构契约）。
- 删除：无。

## 核心实现方式

- 欢迎区用户名使用 `--aircas-color-accent-cyan`；新建去掉 `plain`。
- 工具栏用 `el-select`（`aircas-select` / `aircas-select-popper`）绑定现有 `asc`/`desc`。
- 视图 `el-radio-button` 顺序改为 `card` → `table`。
- 表格沿用 `aircas-table--flat`，去掉页面内重渐变/内发光，缩略图 40px。
- 「进入 / 编辑 / 更多」统一 `type="primary" plain`。

## 新增依赖及必要性

无。

## 验证方式

- TDD：先补结构测试并确认失败，再实现。
- `npm test`、`npm run test:coverage`
- `npm run type-check`、`npm run build:verify`
- `npm run format:check --` 当前任务文件
- 浏览器交互态由开发人员本地对照截图确认

## 后续确认（框选对照）

用户框选面包屑与空间名称列，要求贴近设计图：

- 面包屑去掉「首页」前置项，增加定位图标，条带与页面背景对齐。不新增「公共消息」入口（设计中有、当前无对应能力）。
- 名称列缩略图恢复 48px 方形容器，无图标时也使用同一图框；显示名称使用 `--aircas-color-text-primary`，避免继承表格标题青色。

用户确认按同比例原型对照样式，但撤回补充内容：去掉「今日新增」、迷你折线、「创建用户」列和「公共消息」标签。后续样式修改不改文案，缺少内容不补充，多于内容不删除。
