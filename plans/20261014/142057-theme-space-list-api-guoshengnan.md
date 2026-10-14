# 主题空间列表对接对象空间列表接口（type=1）

- 日期时间：2026-10-14 14:20:57（Asia/Shanghai）
- 分支：dev_sthq_1012_only
- 状态：已确认（用户"确认"）

## 需求理解

主题空间管理页（ThemeSpaceManagement）的主题空间列表当前为静态数组，需对接对象空间列表数据获取接口 `getOntologySpaceListInterface`，传参 `type: 1`。页面内"选择对象空间"下拉已由用户改为同一接口 `type: 0`。

## 修改范围

仅 2 个文件，无新增/删除文件，无新增依赖：

1. `src/views/ThemeSpaceManagement/index.vue`
2. `tests/ontology-space-management.test.mjs`（TDD 先行）

## 核心实现方式

- 删除 `ThemeSpace` 接口、静态 `spaces` 数组及 4 个静态图片 import（airForceImage 等）。
- 新增 `themeSpaces = ref<OntologySpaceItem[]>([])`、`themeSpacesLoading`、`themeSpacesError`。
- 新增 `loadThemeSpaces()`：调用 `getOntologySpaceListInterface({ type: 1 })`，`code !== 200` 抛错，`mapOntologySpaceList(response.data)` 映射赋值；异常 `ElMessage.error`；`finally` 收尾 loading。页面挂载时调用。
- 模板与逻辑字段适配：`name` → `displayName`、`image` → `iconUrl`（空时不渲染 img，参照 SpaceCardGrid 模式）、`metrics.theme` → `metrics.ontology`；表格列字段同名保持。
- 列表区补充 loading / error 展示（当前仅空态），符合异步 loading/success/empty/error 规范。
- 编辑弹窗回填（`openEditThemeSpaceDialog` / `editDraft`）字段同步适配。

## 测试策略（TDD）

- 红阶段：`tests/ontology-space-management.test.mjs` 的 "theme space create dialog..." 测试新增断言：
  - 源码匹配 `getOntologySpaceListInterface({ type: 1 })`
  - 源码匹配 `loadThemeSpaces`
  - 源码不匹配静态数据 `theme_finance`
- 绿阶段：目标测试全部通过。

## 风险说明

- 后端/Mock 对 `type=1` 的支持需浏览器冒烟确认；若 Mock 未覆盖将记录验证缺口。
- 接口未返回统计字段时页面显示 0，与对象空间管理页行为一致，不做额外防御。

## 验证方式

1. TDD 红 → 实施 → 绿：`node --test tests/ontology-space-management.test.mjs`。
2. 全量：`npm test`（基线 12 个预存失败保持、无新增）、`npm run type-check`（基线 4 个预存、无新增）、`npm run build:verify`。
3. `npm run format:check -- <任务文件列表>`。
4. 浏览器冒烟：主题空间管理页列表从接口加载、统计卡片数值、编辑弹窗回填；记录 Mock 对 type=1 的支持情况。
