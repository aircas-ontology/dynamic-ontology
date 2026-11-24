# Plan：对象画像详情主表 query + 子表分页

## 需求理解

点击实体「详情」后，主表属性改用 `POST /ontology/entity/query`，子表改用 `POST /ontology/entity/row_detail/page` 分页；本页不再调用 `POST /ontology/entity/row_detail`。展示形态保持：main 键值对、非 main 表格。`storageGroup` 通过额外一次 `getOntologyPropertyByOntologyId` 汇总非 main 分组（方案 A）。

## 修改范围

- 新增 entity/query 类型、API、Mock
- 详情 composable / 映射 / 子表分页 UI
- 相关测试与 harness

## 新增、修改和删除文件

| 操作 | 路径                                                                                |
| ---- | ----------------------------------------------------------------------------------- |
| 新增 | `src/types/apis/postOntologyEntityIdsQueryType.ts`                                  |
| 修改 | `src/types/index.ts`、`src/apis/ontologyEntityApi.ts`、`src/apis/index.ts`          |
| 新增 | `src/mockData/fixtures/ontology/entity/query.post.json`                             |
| 修改 | `src/mockData/routes.json`                                                          |
| 修改 | `src/views/EntityBrowsingObjectProfile/utils/entityDetailData.ts`                   |
| 修改 | `src/views/EntityBrowsingObjectProfile/composables/useObjectProfileEntityDetail.ts` |
| 修改 | `src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityDetail.vue`    |
| 修改 | `tests/object-profile-entity-detail.test.mjs` 等                                    |
| 新增 | 本 Plan                                                                             |

## 核心实现方式

1. 主表：`[{ ontologyUniqueIdentifier, entityPrimaryKeys: [pk] }]` → 映射为 `storageGroup=main` 属性行。
2. 属性列表：取去重非 `main` 的 `storageGroup`。
3. 每个子表独立 `page/pageSize/total`，默认 pageSize=10；切页仅刷新该组。
4. 分类筛选继续用现有分类树；主表缺 `categoryId` 时按属性名对齐。
5. 其它模块对 `row_detail` / `row_detail/page` 的既有用法不动。

## 新增依赖及必要性

无。

## 验证方式

TDD → 相关单测 → format:check → type-check / build:verify（按变更范围）。
