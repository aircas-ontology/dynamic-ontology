# 对接本体对象资源统计

## 需求理解

按 `docs/20260923/1.getOntologyMetaStatisticApi.md` 接入对象详情页「对象资源统计」。页面四项计数改为接口数据：实例 `entityCount`、属性 `propertyCount`、关系 `relationCount`、行为 `actionCount`。查询参数使用路由 `objectId`，对应 `uniqueIdentifier`。

## 修改范围

- 新增接口、类型和成功 Mock。
- 对象详情页去掉写死计数，按对象标识请求统计，并补加载中、失败和重试。
- Tab 徽标继续使用属性、关系、行为三项。

## 新增、修改和删除文件

- 新增 `src/types/apis/getOntologyMetaStatisticType.ts`
- 新增 `src/mocks/getOntologyMetaStatisticMock/getOntologyMetaStatisticMock.ts`
- 新增 `src/views/OntologyObjectDetail/composables/useObjectResourceStatistic.ts`
- 新增 `tests/get-ontology-meta-statistic-api.test.mjs`
- 修改 `src/apis/ontologyObjectManageApi.ts`、`src/apis/index.ts`、`src/types/index.ts`
- 修改 `src/views/OntologyObjectDetail/index.vue`、`src/views/OntologyObjectDetail/components/OntologyObjectOverviewPanel.vue`
- 不删除文件

## 契约映射

- `GetOntologyMetaStatisticParams.uniqueIdentifier: string`
- `OntologyMetaStatisticVO`：`uniqueIdentifier`、`entityCount`、`propertyCount`、`relationCount`、`actionCount`
- `GetOntologyMetaStatisticData = OntologyMetaStatisticVO`
- `getOntologyMetaStatisticInterface`：GET `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/meta/statistic"`，query `params`
- Mock 仅成功样例：`code` 200、`message` `SUCCESS`、`success` true，以及文档中的计数字段

## 核心实现方式

- 页面映射为 `entity`、`property`、`relation`、`behavior`。
- 同一对象加载中不重复请求，过期响应不覆盖新结果。
- 缺少对象标识、请求失败或 `code` 不是 200 时显示错误，计数保持为空并显示「—」。
- 不回退到原来的写死数字。

## 新增依赖

- 无

## 验证方式

- `tests/get-ontology-meta-statistic-api.test.mjs`
- 任务文件格式检查
- `npm run check:types-conventions`
- `npm run type-check`
- `npm run build:verify`
