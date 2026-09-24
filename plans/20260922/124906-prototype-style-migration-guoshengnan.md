# 本体页面原型样式迁移实施方案

## 需求理解

将当前 `dev-project` 的本体空间管理、空间详情、对象属性、概念模型、大模型构建和子空间页面的视觉表现调整为 `github-project` 原型基线，同时保留当前已接入的路由、接口、数据流和业务行为。

## 修改范围

1. 全局布局：顶栏、面包屑、侧栏尺寸和工作区滚动边界。
2. 全局主题：暗色/亮色 Aircas 设计令牌及 Element Plus 映射。
3. 公共控件：原型操作按钮、弹窗底部按钮间距和页面面板通用表现。
4. 空间管理：首页统计、空间列表/卡片、创建弹窗和操作栏。
5. 空间详情：分类树、对象卡片/表格、工具栏、空状态和操作按钮。
6. 对象属性：属性分类树、属性列表、创建/编辑弹窗、数据源关联弹窗。
7. 概念模型：顶栏、调色板、画布节点、连线、检查器。
8. 大模型和子空间：步骤栏、资源面板、表格和底部操作栏。
9. 构建期资源仅迁移到 `src/assets`；不修改 `public/`、`html/`。

## 文件变更计划

### 第一批：全局基线

- 修改 `src/layout/index.vue`、`src/layout/components/HeaderBar.vue`、`src/layout/components/NavigationMenu.vue`。
- 修改 `src/styles/theme-dark.css`、`src/styles/theme-light.css`、`src/styles/index.scss`。
- 新增本体页面私有按钮样式文件，或将原型按钮规则按当前目录规范迁移到对应页面组件样式中。
- 只调整主题变量、公共布局尺寸和状态表现，不改变业务接口。

### 第二批：本体业务页面

- 修改 `src/views/OntologySpaceManagement/components/*`。
- 修改 `src/views/OntologySpaceManagementDetail/components/*`。
- 修改 `src/views/OntologyObjectDetail/components/*`。
- 保留现有 API、Store、路由和异步状态，重点调整 DOM 结构所需的最小模板、类名和 scoped SCSS。

### 第三批：工作台页面

- 修改 `src/views/OntologyConceptualModelCreate/*`。
- 修改 `src/views/OntologyLlmBuilder/index.vue`。
- 修改 `src/views/OntologySubspaceCreate/index.vue`。
- 只在视觉对齐确实需要时调整模板结构；保留画布生命周期、连接关系、保存创建空间逻辑。

## 核心实现方式

- 以原型 `github-project/src/styles/theme-*.css` 和页面 scoped SCSS 为视觉来源。
- 复用当前项目已有 `--aircas-*` 令牌和 Element Plus 覆盖，原型变量缺失时在暗色/亮色主题中成对补齐。
- 本体业务样式使用完整 BEM 类名和主题变量，不在页面中硬编码颜色。
- 统一检查 normal、hover、active、disabled、focus-visible、overflow、empty、loading、error 状态。
- 不新增第三方依赖，不复制原型锁文件。

## 验证方式

- 修改后运行 `npm run type-check`、`npm run build:verify`、`npm run format:check -- <本次修改文件>`。
- 运行 `git diff --check` 并检查 `git status --short`，确认不触碰 `html/`、`public/`，无计划外文件。
- 在 1920×1080、1440×900、1280×800 和窄容器下检查布局；检查暗色和亮色主题、弹窗、树、卡片、表格和画布交互。
