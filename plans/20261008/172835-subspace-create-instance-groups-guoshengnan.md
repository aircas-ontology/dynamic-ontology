# 子空间创建：选择实例按对象分组并分页

## 需求理解

只改子空间创建第二步「选择实例」：

- 按所属对象分块展示，不再用一张混在一起的表。
- 每个对象一块：标题（对象名、已选/总数、全选）+ 实例表（勾选、实例名称）。
- 每个对象的实例表分页：`aircas-pagination`，默认每页 10 条，可选 10/20/50；翻页后勾选状态保留。
- 样例实例从每个对象 2 条增到 12 条，让分页能看见。

不改左侧分类树、第一步对象卡片、第三步属性、第四步关系。不碰 `SubspaceCreateTreePanel.vue`、`public/`、`html/`。

## 修改范围

`OntologySubspaceCreate` 页面私有组件和工具。工作区面板已超过 1000 行，实例步拆成独立子组件。

## 新增、修改和删除文件

新增：

- `src/views/OntologySubspaceCreate/components/SubspaceCreateInstancePanel.vue`
- 本 Plan 文件

修改：

- `src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue`
- `src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedInstance.ts`
- `tests/ontology-subspace-create.test.mjs`

不删除文件。不新增依赖。

## 核心实现方式

- 工具函数把实例按 `objectId` 编成与属性步类似的 group，并提供分页切片、页码收敛、单条/分组勾选合并。
- 勾选沿用父级 `selectedInstanceIds`；单条用 checkbox，组头「全选」只作用该对象全部实例（含未在当前页的）。
- 每个分组自己维护 `page` / `pageSize`，对象列表变化时把页码收回合法范围。
- 样式复用现有对象分组卡片语言和 `aircas-table` / `aircas-pagination`。

## 新增依赖及必要性

无。

## 验证方式

- TDD：源码契约（按对象分组、分页、全选、不再用扁平「所属对象」列）+ 分组/分页/勾选纯函数行为测试。
- `npm test`（本任务相关用例）、`npm run test:coverage`（新工具统计范围）
- `npm run type-check`、`npm run build:verify`
- 任务文件 `format:check`
