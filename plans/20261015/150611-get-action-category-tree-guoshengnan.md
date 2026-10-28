# 行为分类树查询接口对接

## 需求理解
根据 docs/20261015/2.getActionCategoryTreeApi.md 对接行为分类体系树查询接口。按用户确认，ActionCategoryVO 先使用文档示例中的 id、name、children 字段，后续有完整模型数据时再扩展。

## 修改范围
新增行为分类树查询接口的类型、API 函数和 Mock，并接入公共出口与契约测试。

## 新增、修改和删除文件
- 新增 `src/types/apis/getActionCategoryTreeType.ts`
- 新增 `src/apis/actionCategoryApi.ts`
- 新增 `src/mocks/getActionCategoryTreeMock/getActionCategoryTreeMock.ts`
- 修改 `src/types/index.ts`
- 修改 `src/apis/index.ts`
- 新增接口契约测试文件

## 核心实现方式
使用 GET 请求，路径为 `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action_category/tree"`，通过 `params` 传递必填 `spaceId`；响应类型为 `ApiResponse<ActionCategoryVO>`。Mock 使用文档提供的成功响应样例。

## 新增依赖及必要性
无。

## 验证方式
执行相关接口测试、`npm test`、`npm run test:coverage`、`npm run check:types-conventions`、`npm run type-check`、`npm run build:verify`，并对本次修改文件执行 Prettier 检查。
