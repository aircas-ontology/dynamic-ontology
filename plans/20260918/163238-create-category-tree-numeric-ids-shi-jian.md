# 创建分类树请求体 id 改为数字

## 需求理解

创建分类树失败是因为请求体类型与契约不一致。`spaceId`、`parentId` 都应为 number。`parentId` 已固定为数字 `0`，只需把路由中的空间 id 转成数字后再提交。

## 修改范围

只改创建分类树的请求体类型和提交处。查询分类树的 `spaceId` 仍为字符串查询参数。

## 文件

- 修改 `src/types/apis/ontologyCategoryTreeType.ts`：`CreateOntologyCategoryTreeParams.spaceId` 改为 `number`。
- 修改 `src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`：提交前 `Number(space)`，非整数时不发请求。
- 修改 `src/apis/ontologyManageApi.ts`：JSDoc 标明这两个字段为数字。
- 修改 `tests/ontology-category-tree-api.test.mjs`。

## 核心实现

请求体为 `{ spaceId: number, parentId: 0, name: string }`。

## 新增依赖

无。

## 验证

相关测试先失败再通过；随后 `type-check`、`build:verify`、任务文件格式检查。
