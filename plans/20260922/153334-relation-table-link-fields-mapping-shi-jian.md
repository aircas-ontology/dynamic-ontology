# 关系表格渲染 apiName / 分类 / description

## 需求理解

查询关系分类树 `links` 已返回 `apiName`、`description`、`categoryId`；表格三列当前为空，因 mapper 硬编码为空串。

## 修改范围

- `src/types/apis/ontologyRelationCategoryTreeType.ts`
- `src/views/OntologySpaceManagementDetail/utils/mapOntologyRelationCategoryTree.ts`
- `src/mocks/ontologyRelationCategoryTreeMock/ontologyRelationCategoryTreeMock.ts`
- `tests/ontology-relation-category-tree-api.test.mjs`

## 新增、修改和删除文件

- 修改：上述四个文件
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. Link 类型增加可选 `apiName`、`description`、`ontologyIconFrom`。
2. mapper：`apiName`/`description` 直接映射；`categoryName` 优先按 `categoryId` 查树节点 `name`，否则用挂载该 links 的节点 `name`。
3. Mock 同步契约最新输出样例。
4. 更新相关测试断言。

## 新增依赖及必要性

无。

## 验证方式

- 关系分类树相关测试
- `npm run type-check`
- 任务文件 `format:check`
