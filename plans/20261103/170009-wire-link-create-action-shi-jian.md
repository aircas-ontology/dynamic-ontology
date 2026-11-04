# Wire relation-instance createAction (LINK)

## 需求理解

按 `docs/20261103/createActionApi.md` §3.3，将「基础行为 + 关系实例」草稿对接 `POST /ontology/action`：

- `subjectType: "LINK"`，`operation` 由基础操作映射为 CREATE/UPDATE/DELETE
- `linkMapping.ontologyLinkUniqIdentifier` = 选中关系 id
- **新增**：`targetStatus` + `visibilityWindows` 必填
- **修改**：`targetStatus` 必填（允许 ENABLE/DELETE，与当前文档示例一致）；`visibilityWindows` 有值才传
- **删除**：`linkMapping` 仅 `ontologyLinkUniqIdentifier`
- 外层 `ontologyIdentifier`：取所选关系的 `ontologyUniqueIdentifierFrom`
- 不传 `storageGroup` / `mappingIns` / `outputMode`

## 修改范围

- `createOntologyActionType.ts`：`linkMapping`；`storageGroup`/`mappingIns` 可选
- 关系行增加 `sourceOntologyId` / `targetOntologyId`
- 新增 `buildLinkCreateActionParams.ts`
- `BehaviorFormDialog.vue`：选中关系写入 `ontologyIdentifier`
- `useSpaceBehaviorWorkspace.ts`：LINK 远程创建
- 测试覆盖

## 新增依赖

无。

## 验证方式

- 单测 CREATE/UPDATE/DELETE 请求体与错误分支
- `format:check`；`build:verify`；无本任务新增 type-check 错误
