# Plan：全局检索四类型跳转（按最新 shijian.md）

## 需求理解

按 `docs/20260923/shijian.md` 27–33 与 `8.getInfoByObjectidApi-shijian.md`：

- 空间：`/workspace/ontology-space-management/{spaceId}/overview`
- 对象：`/workspace/ontology-space-management/{spaceId}/object`
- 关系分组：`/workspace/ontology-space-management/{spaceId}/relation`
- 属性：先 `GET /ontology/meta/{objectid}`，再用 `uniqueIdentifier`、`displayName`（objectName）、`spaceName` 与检索项 `spaceId` 跳转 `/workspace/ontology-object/{uniqueIdentifier}/object`

## 修改范围

纳入：getInfo API/Types/Mock、检索路由解析、点击跳转、相关测试。  
不纳入：实例类型；改检索 UI。

## 文件

- 新增 `src/types/apis/getOntologyMetaByObjectIdType.ts`
- 新增 `src/mocks/getOntologyMetaByObjectIdMock/getOntologyMetaByObjectIdMock.ts`
- 修改 `ontologyObjectArrManageApi.ts`、`apis/index.ts`、`types/index.ts`
- 修改 `ontologyGlobalSearchRoute.ts`、`useOntologyGlobalSearch.ts`
- 修改 `tests/ontology-global-search.test.mjs`，新增 `tests/get-ontology-meta-by-object-id-api.test.mjs`

## 验证

TDD → 相关测试 → format → types conventions → type-check / build:verify
