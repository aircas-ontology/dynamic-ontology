# 对接编辑关系 PUT /ontology/link

## 需求理解

按 `docs/20260921/updateOntologyLinkApi-shijian.md` 对接编辑关系；可改 name / categoryId / description；源/目标与 apiName 只读。

## 修改范围

- 新建 `updateOntologyLinkType.ts`、`updateOntologyLinkMock.ts`、`update-ontology-link-api.test.mjs`
- 修改 `ontologyManageApi.ts`、`apis/index.ts`、`types/index.ts`
- 修改 `SpaceRelationFormDialog.vue`、`SpaceRelationWorkspace.vue`
- 更新相关关系测试

## 核心实现方式

1. PUT `/ontology/link`，请求体 `uniqueIdentifier`、`name`、`categoryId`、`description`。
2. 编辑提交调 `putUpdateOntologyLinkInterface`，成功后刷新工作区。
3. 编辑态禁用 apiName、源本体、目标本体；分类不可清空；描述必填。

## 新增依赖及必要性

无。

## 验证方式

- update-ontology-link 与相关关系测试
- format:check、type-check
