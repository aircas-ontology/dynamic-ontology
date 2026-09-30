# 子空间创建对象卡片样式调整

## 需求理解

将子空间创建页第一步“选择对象”中的对象卡片调整为参考图二的紧凑深色横向卡片：卡片具备细边框、左侧对象图标、右侧两行名称与 API 名称，并保留现有对象选择数据和页面流程。

## 修改范围

- 仅调整 `SubspaceCreateWorkspacePanel.vue` 的对象卡片模板和局部 scoped 样式。
- 复用现有 Aircas 主题变量与 Element Plus `Ship` 图标，不新增依赖，不修改接口、类型、状态流或路由。
- 同步更新子空间创建页面的静态样式断言，确保卡片结构、主题变量、尺寸和交互状态得到验证。

## 文件变更

- 修改：`src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue`
- 修改：`tests/ontology-subspace-create.test.mjs`
- 新增：本 Plan 文件
- 删除：无

## 核心实现方式

- 卡片使用固定的最小宽度和自适应列布局，保持多卡片横向排列。
- 卡片背景使用 `--aircas-color-input-background`，边框使用 `--aircas-color-border-soft`，hover/focus 使用现有交互和强调色变量。
- 图标区域固定尺寸并居中，名称和 API 名称保持两行展示，长文本使用省略号避免溢出。
- 通过 `aria-label` 和现有 focus-visible 样式保留可访问性与键盘焦点反馈。

## 新增依赖

无。

## 验证方式

- `node --test tests/ontology-subspace-create.test.mjs`
- `npm run format:check -- src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue tests/ontology-subspace-create.test.mjs plans/20260930/111934-subspace-object-card-style-guoshengnan.md`
- `npm run type-check`
- `npm run build:verify`
- `git diff --check`
