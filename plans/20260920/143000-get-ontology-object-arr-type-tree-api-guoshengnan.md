# 属性分类树查询接口接入计划

## 需求理解

根据 `docs/20260920/getOntologyObjectArrTypeApi-guoshengnan.md` 接入本体对象属性分类树查询接口。已确认采用正文约定的 GET 方法，接口通过 query 传递 ontologyUniqueIdentifier；同时修正文档中与正文冲突的 POST 示例、类型命名和 Mock 路径。

## 契约映射

- GET `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL/ontology/property/category`
- query 参数：`ontologyUniqueIdentifier: string`
- 响应 data：递归分类节点 `{ categoryId: number; name: string; children?: Node[] }`
- code 为 200 判定查询成功；页面错误时显示明确失败信息。

## 文件变更

- 修改 `docs/20260920/getOntologyObjectArrTypeApi-guoshengnan.md`
- 新增 `src/types/apis/getOntologyObjectArrTypeTreeType.ts`
- 新增 `src/apis/ontologyObjectArrManageApi.ts`
- 新增 `src/mocks/getOntologyObjectArrTypeTreeMock/getOntologyObjectArrTypeTreeMock.ts`
- 修改 `src/types/index.ts`、`src/apis/index.ts`
- 修改 `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`，使用当前路由 objectId 查询并映射分类树。
- 新增 `tests/get-ontology-object-arr-type-tree-api.test.mjs`

## 验证方式

执行接口与页面专项测试、类型检查、构建验证、任务文件格式检查和 git diff --check。
