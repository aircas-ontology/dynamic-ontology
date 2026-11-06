# 关系实例行为测试

## 需求理解

基础行为-关系实例点击「测试」后：

1. 打开测试弹框；
2. 先调行为详情 `getOntologyActionInfo`，取 `linkMapping.ontologyLinkUniqIdentifier`；
3. 再调 `GET /ontology/link?uniqueIdentifier=...`；
4. 展示 `ontologyNameFrom` / `ontologyNameTo`，并分别按 From/To 对象 id 分页加载实例列表供单选；
5. 「开始测试」提交：`ontologySpaceId`、`actionApi`、`entityPrimaryKey`（挂载侧）、`linkEntityPrimaryKey`（对端）。本轮不传 `params` / `dataPrimaryKey`。

挂载侧判定：行为列表项 `ontologyUniqIdentifier` 与 From/To 对象 id 比对。

## 修改范围

- 新增 getOntologyLinkByUniqueIdentifier 类型 / API / Mock / 契约测试
- 入口放宽 relationInstance
- BehaviorTestDialog 双实例选择与提交
- 更新 ontology-space-behavior 测试

## 新增、修改和删除文件

- 新增：`src/types/apis/getOntologyLinkByUniqueIdentifierType.ts`
- 新增：`src/mockData/fixtures/ontology/link.get.json`
- 新增：`src/mocks/getOntologyLinkByUniqueIdentifierMock/getOntologyLinkByUniqueIdentifierMock.ts`
- 新增：`tests/get-ontology-link-by-unique-identifier-api.test.mjs`
- 新增：本 Plan
- 修改：`src/types/index.ts`、`src/apis/ontologyManageApi.ts`、`src/apis/index.ts`、`src/mockData/routes.json`
- 修改：`src/views/SpaceBehaviorWorkspace/index.vue`、`BehaviorTestDialog.vue`
- 修改：`tests/ontology-space-behavior.test.mjs`

## 核心实现方式

详情 → link → 双实体列表 → 按挂载侧映射主键提交 test。

## 新增依赖

无

## 验证方式

- `node --test tests/get-ontology-link-by-unique-identifier-api.test.mjs tests/ontology-space-behavior.test.mjs`
- `npm run format:check -- <本次文件>`
- `npm run check:types-conventions`、`npm run type-check`、`npm run build:verify`
