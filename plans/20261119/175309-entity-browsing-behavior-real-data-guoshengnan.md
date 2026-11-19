# 空间浏览行为 Tab 对接真实对象行为

## 需求理解

将空间浏览工作区「行为」Tab（`EntityBrowsingBehavior`，当前杜威号静态 Mock）对接真实对象行为接口：分类树、分页列表、测试执行走现有 Ontology Action API；浏览侧只读查询 + 测试，不做管理端 CRUD。实体详情内「对象行为」已对接真实接口，本次不改。

## 修改范围

- `src/views/EntityBrowsingBehavior/**` 数据加载与列表/分类展示
- `src/views/EntityBrowsing/index.vue` 行为 Tab 计数
- 映射工具与对应测试
- 不改：`EntityBrowsingObjectProfile` 已有行为链路、`SpaceBehaviorWorkspace` 管理 CRUD、`html/`、`public/`
- 本期不做：杜威轨迹预测地图、假执行记录；无真实接口支撑的入口隐藏

## 新增、修改和删除文件

| 操作     | 路径                                                                                         |
| -------- | -------------------------------------------------------------------------------------------- |
| 新增     | `src/views/EntityBrowsingBehavior/composables/useEntityBrowsingBehaviorWorkspace.ts`         |
| 新增     | `src/views/EntityBrowsingBehavior/utils/mapBrowseActionCategoryTree.ts`                      |
| 新增     | `src/views/EntityBrowsingBehavior/utils/browseBehaviorCategoryTree.ts`                       |
| 新增     | `src/views/EntityBrowsing/composables/useEntityBrowseBehaviorCount.ts`                       |
| 新增     | `tests/entity-browsing-behavior-workspace.test.mjs`                                          |
| 修改     | `EntityBrowsingBehavior/index.vue`、`BehaviorCategoryPanel.vue`、`BehaviorInstancePanel.vue` |
| 修改     | `EntityBrowsing/index.vue`（计数改真实 total）                                               |
| 停用入口 | Dewey 调用测试 / 执行记录默认路径（文件暂留）                                                |

## 核心实现方式

1. Composable：`getActionCategoryTreeInterface` + `getListOntologyActionInterface`；处理 loading / empty / error、防重复与过期响应。
2. 分类 / 列表：真实分类树驱动左侧（去掉行为叶子）；列表字段对齐 `SpaceBehaviorItem`；筛选项为 keyword / status / actionKind。
3. 测试：复用 `BehaviorTestDialog` / `BehaviorTreeTestDialog`。
4. Tab 计数：行为数用列表接口 `total`，不再用 `powerBehaviorInstances.length`。
5. 浏览主路径不再引用 `deweyBehaviorMock`。

## 新增依赖及必要性

无。

## 验证方式

TDD → `npm test`、`test:coverage`、`type-check`、`build:verify` → 任务文件 `format:check` → `git diff --check`。
