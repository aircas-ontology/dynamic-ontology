# 关系实例 targetStatus 增加 DISABLE 并按基础操作过滤

## 需求理解

关系实例新增可选 ENABLE/DISABLE；修改可选 ENABLE/DISABLE/DELETE。

## 修改范围

- ontologySpaceBehaviorType.ts
- createOntologyActionType.ts
- BehaviorFormDialog.vue
- buildLinkCreateActionParams.ts
- mapOntologyActionInfoToFormState.ts
- tests

## 新增依赖

无

## 验证方式

相关单测 + format:check
