# 选择数据行改用 row_detail/page

## 需求理解

属性值-修改/删除测试弹框中「选择数据行」改为调用 `docs/20261109/rowDetailPageApi.md`（`POST /ontology/entity/row_detail/page`）。「查看实例数据」弹框继续使用现有 `row_detail`。

## 修改范围

- 类型 / API / Mock：按 Api.md 新增分页契约
- 映射与 UI：`mapOntologyEntityRowDetailToDataRows.ts`、`BehaviorTestDialog.vue`
- 单测：`tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 新增 `src/types/apis/getOntologyEntityRowDetailPageType.ts` 并导出
- 修改 `src/apis/ontologyEntityApi.ts`、`src/apis/index.ts`
- 新增 page Mock 与 mockData fixture/路由
- 新增 `mapOntologyEntityRowDetailPageToDataRows`；弹框改用 page 接口并加分页
- 无删除、无新依赖

## 核心实现方式

1. 契约按 Api.md 落地 types/api/mocks。
2. 映射用请求侧 storageGroup；摘要用 propertyApiName + propertyValues。
3. BehaviorTestDialog 的 loadEntityGroupDataRows 改调 page 接口并分页。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- `npm run check:types-conventions`、`npm run type-check`、`npm run build:verify`
- `npm run format:check --` 本次改动文件
