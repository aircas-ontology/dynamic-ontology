# Plan：实体列表 Tab：接接口 + 图二样式

## 需求理解

- 对象画像页「实体列表」目前仍是「内容待配置」。
- 调用已有接口 `getOntologyEntitiesInterface`（`GET /ontology/entity/list`），`ontologyUniqueIdentifier` 取路由 `objectId`。
- 内容区样式按图二：顶栏「筛选字段 / 筛选值 / 重置 / 查询」+ 右侧「配置」；下方深色表格，首列「操作-详情」，其余列为实体主属性动态字段。
- 默认约定：接口无筛选参数，筛选在当前已加载页数据上做前端过滤；「配置」仅保留按钮样式，点击提示「功能待接入」；「详情」用 `el-dialog` 只读展示该行全部属性，不新增路由。

## 修改范围

- 页面：`src/views/EntityBrowsingObjectProfile/`
- 类型：必要时补页面展示类型到 `src/types/pages/entityBrowsingObjectProfileType.ts` 并经 `src/types/index.ts` 导出
- Mock：充实 `src/mockData/fixtures/ontology/entity/list.get.json`
- 测试：新增 `tests/entity-browsing-object-profile-entity-list.test.mjs`

不改 `public/`、不改接口封装路径；复用现有 API/类型。

## 新增、修改和删除文件

- 新增 `ObjectProfileEntityList.vue`
- 新增 `composables/useObjectProfileEntityList.ts`
- 新增 `utils/mapObjectProfileEntityRows.ts`
- 修改 `index.vue`
- 修改 Mock fixture + 对应测试
- 无删除；无新 npm 依赖

## 核心实现方式

1. `objectId` 为空：不请求，empty + 提示缺对象标识。
2. 进入 Tab / `objectId` 变化：`pageNum=1`，`pageSize` 默认 20，调接口。
3. 列：固定「操作」；其余列 = 当前页记录属性键并集（优先 `properties`）。
4. 筛选：下拉选项 = 当前列；查询按字段+值做包含匹配。
5. 分页：`el-pagination` 绑定接口分页，翻页重新请求。
6. 样式：与同页其它 Tab 一致；表格横向滚动；行 hover 用主题主色软底。

## 新增依赖及必要性

无。

## 验证方式

- TDD：`tests/entity-browsing-object-profile-entity-list.test.mjs` 先红后绿
- `npm test`、`npm run test:coverage`
- `npm run type-check`、`npm run build:verify`
- `npm run format:check -- <改动文件列表>`
- 人工：对象画像 → 实体列表
