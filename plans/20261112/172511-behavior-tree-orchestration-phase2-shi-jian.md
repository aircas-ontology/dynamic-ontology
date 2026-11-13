# 行为树编排二期：真保存与编辑加载

## 需求理解

接入 TREE 行为真保存与编辑加载：创建 `POST /ontology/action`，之后与编辑均 `PUT`；编辑打开时自动 `GET /ontology/action` 加载 `treeDefinition`；保存成功后停留编排页并将按钮切为「更新」。

## 修改范围

- `src/apis/behaviorTreeApi.ts`、`src/apis/index.ts`
- `src/types/apis/getOntologyActionInfoType.ts`、`src/types/pages/behaviorTreeOrchestrationType.ts`
- `src/views/BehaviorTreeOrchestration/**`（persistence util、composable、dialog、readme）
- `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- `src/views/SpaceBehaviorWorkspace/index.vue`（列表刷新）
- `tests/behavior-tree-orchestration.test.mjs`

## 新增、修改和删除文件

- 新增：`utils/behaviorTreePersistence.ts`
- 修改：上述范围文件
- 删除：无

## 核心实现方式

1. TREE POST/PUT 封装，body 使用 `buildBehaviorTreeSavePayload`。
2. 详情类型增加可选 `treeDefinition`；编辑态打开后校验 `actionKind=TREE` 并导入定义。
3. `hasPersisted` 由 `isEditMode` 初始化；POST 成功后置 true，按钮显示「更新」，不关弹框。
4. 向父级 emit `persisted`，表单同步 `isEditMode`，工作区刷新列表。
5. 保存/加载具备 submitting 防重与过期 token 防护。

## 新增依赖及必要性

无。

## 验证方式

- 编排单测（方法选择、详情提取、API/UI 接线）
- format:check（任务文件）
- type-check / build:verify（本期无新增 TS 报错）
