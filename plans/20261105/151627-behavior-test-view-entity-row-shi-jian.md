# 测试弹窗「查看实例数据」+ entity/row_detail

## 需求理解

在行为测试弹窗 footer「关闭」左侧增加【查看实例数据】；点击后弹出详情弹框，调用 `POST /ontology/entity/row_detail`，按存储分组展示属性行数据。

## 修改范围

- 新增 row_detail 类型、API、Mock
- 新增实例数据详情弹框组件
- 测试弹窗接入按钮与打开逻辑

## 新增、修改和删除文件

### 新增

- `src/types/apis/getOntologyEntityRowDetailType.ts`
- `src/mockData/fixtures/ontology/entity/rowDetail.post.json`
- `src/mocks/getOntologyEntityRowDetailMock/getOntologyEntityRowDetailMock.ts`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorEntityRowDetailDialog.vue`
- `tests/get-ontology-entity-row-detail-api.test.mjs`
- `plans/20261105/151627-behavior-test-view-entity-row-shi-jian.md`

### 修改

- `src/apis/ontologyEntityApi.ts`
- `src/apis/index.ts`
- `src/types/index.ts`
- `src/mockData/routes.json`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

### 删除

无

## 核心实现方式

1. `postGetOntologyEntityRowDetailInterface` → `ONTOLOGYMANAGE_URL + "/ontology/entity/row_detail"`。
2. 请求：`ontologyUniqueIdentifier`、`entityPrimaryKey`、`sort: "DESC"`。
3. 类型按字段表；`data` 为 VO | null；Mock 使用最小非空 VO 便于展示。
4. 未选实体时提示；详情弹框按 `storageGroup` / `groupDataList` / `props` 展示。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/get-ontology-entity-row-detail-api.test.mjs tests/ontology-space-behavior.test.mjs`
- `npm run format:check -- <任务文件>`
