# 创建关系接口 comment 改为 description

## 需求理解

`docs/20260920/createOntologyLinkApi-shijian.md` 将请求体可选字段由 `comment` 改为 `description`，同步类型、JSDoc 与创建提交赋值。

## 修改范围

- `src/types/apis/createOntologyLinkType.ts`
- `src/apis/ontologyManageApi.ts`
- `src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue`
- `tests/create-ontology-link-api.test.mjs`

## 新增、修改和删除文件

- 修改：上述四个文件
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. `CreateOntologyLinkParams.comment` 重命名为 `description`。
2. API JSDoc `@param` 同步为 `payload.description`。
3. 创建关系时写入 `requestBody.description`。
4. 契约测试断言改为 `description`。

## 新增依赖及必要性

无。

## 验证方式

- `create-ontology-link-api` 相关测试
- `npm run type-check`
- 任务文件 `format:check`
