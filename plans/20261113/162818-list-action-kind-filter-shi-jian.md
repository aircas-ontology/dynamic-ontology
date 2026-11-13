# 行为列表增加行为类别筛选

## 需求理解

列表查询新增可选 `actionKind`（BASE / APPLICATION / TREE，不传查全部）；界面筛选区同步增加「行为类别」下拉。

## 修改范围

- `src/types/apis/listOntologyActionType.ts`
- `src/views/SpaceBehaviorWorkspace/utils/mapListOntologyActionRecord.ts`
- `src/views/SpaceBehaviorWorkspace/composables/useSpaceBehaviorWorkspace.ts`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorListPanel.vue`
- `src/views/SpaceBehaviorWorkspace/index.vue`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件；新增本 Plan
- 无删除、无新依赖

## 核心实现方式

1. `ListOntologyActionParams.actionKind?: "BASE" | "APPLICATION" | "TREE"`。
2. `mapSpaceBehaviorKindToActionKindQuery`：basic→BASE、application→APPLICATION、behaviorTree→TREE。
3. Workspace 增加 kindFilter/appliedKind；查询/重置/切空间同步；list 请求附带 actionKind。
4. ListPanel 增加可清空「行为类别」下拉，复用 `SPACE_BEHAVIOR_KIND_OPTIONS`。

## 新增依赖及必要性

无。

## 验证方式

ontology-space-behavior 测试；format:check；check:types-conventions；type-check；build:verify。
