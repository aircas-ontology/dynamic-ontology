# Add 对象信息 for basic / attributeValue / create

## 需求理解

在 `BehaviorFormDialog.vue` 中，当 `kind === 'basic'` 且 `valueType === 'attributeValue'` 且 `basicAction === 'create'` 时，在行为类型/基础操作下方增加「对象信息」区块：

- 对象下拉：`getOntologyCategoryTreeInterface` + `mapOntologyObjectsToRelationOptions`
- 属性多选表：`getOntologyObjectArrTypeTreeInterface`，扁平化 `propertyInfos`（含 storageGroup）
- 仅限制同一存储分组可多选；不对齐 createActionApi
- 对象必选；属性至少选 1 项；切离条件或换对象时清空选择

## 修改范围

- `src/types/pages/ontologySpaceBehaviorType.ts`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- `src/views/SpaceBehaviorWorkspace/utils/flattenPropertyInfosFromCategoryTree.ts`（新增）
- `src/mocks/ontologySpaceBehaviorMock/ontologySpaceBehaviorMock.ts`
- `src/views/ObjectBehaviorWorkspace/components/ObjectBehaviorFormDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 新增：`flattenPropertyInfosFromCategoryTree.ts`
- 修改：上述其余文件
- 无删除

## 核心实现方式

Draft 增加 `ontologyIdentifier`、`selectedPropertyIds`、`storageGroup`；条件渲染对象信息区；同组多选约束；异步加载覆盖 loading/empty/error。

## 新增依赖及必要性

无。

## 验证方式

`ontology-space-behavior` 测试、`format:check`、`type-check`、`build:verify`；人工确认条件显示与同组限制。
