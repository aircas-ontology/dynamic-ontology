# Wire createAction for attribute-value create

## 需求理解

创建路径下，基础行为 + 属性值 + 新增/修改/删除调用 `POST /ontology/action`；mappingIns 仅勾选属性；新增/修改 FIXED+sourceConfig；删除仅双 id；编辑/另存仍 Mock。

## 修改范围

- types/apis/createOntologyActionType.ts、apis/ontologyActionApi.ts、mockData fixture+routes
- buildPropertyValueCreateActionParams、SpaceBehaviorDraft.selectedPropertyApiNames
- BehaviorFormDialog、ObjectBehaviorFormDialog、useSpaceBehaviorWorkspace、index.vue
- tests

## 新增依赖及必要性

无。

## 验证方式

ontology-space-behavior、format:check、check:types-conventions、build:verify。
