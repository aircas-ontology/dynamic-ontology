# 全文检索按空间类型跳转

## 需求理解
全文检索结果通过 `spaceType` 区分对象空间（0）与主题空间（1）。两类空间复用现有路由结构；主题空间跳转追加 `from=theme-space-management`，并在支持的结果中保留 `spaceType=1`。

## 修改范围
- 扩展全文检索结果类型，约束 `spaceType` 为 0 | 1。
- 修改全文检索路由解析，覆盖空间、关系分组、对象、属性四类结果，并保留现有对象空间路径。
- 修改空间详情加载，根据 `spaceType` 查询对象空间或主题空间。
- 修改对象详情上下文与 Tab 切换，保留空间类型和来源参数。
- 增加全文检索路由回归测试。

## 文件
- 修改：`src/types/apis/ontologyGlobalSearchType.ts`
- 修改：`src/utils/ontologyGlobalSearchRoute.ts`
- 修改：`src/views/OntologySpaceManagementDetail/composables/useSpaceWorkspace.ts`
- 修改：`src/views/OntologyObjectDetail/composables/useObjectDetailWorkspace.ts`
- 修改：`src/views/OntologyObjectDetail/index.vue`
- 修改：`tests/ontology-global-search.test.mjs`
- 新增：无；删除：无。

## 核心实现
使用数值 `spaceType` 判断空间类型。对象空间路由保留 `spaceType=0`（对象空间概览可不增加 query 以保持现有 URL）；主题空间路由追加 `from=theme-space-management` 和 `spaceType=1`。空间详情加载优先使用显式 `spaceType`，兼容既有主题来源标记。

## 依赖
不新增依赖。

## 验证
执行全文检索测试、`npm test`、`npm run format:check`（仅修改文件）、`npm run type-check`、`npm run build:verify`、`git diff --check`。
