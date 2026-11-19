# Plan: 基础函数保存对齐 writeBack

## 需求理解

按 `createActionApi.md` §3.4，创建/保存时把表单写入字段组装为 `basicFunction.writeBack`；无完整写入配置则不传。

## 修改范围

类型、`buildBasicFunctionCreateActionParams`、表单写入字段带 `storageGroup`、详情回填、相关测试。

## 新增、修改和删除文件

- 修改：`src/types/apis/createOntologyActionType.ts`、`src/types/index.ts`
- 修改：`src/types/pages/ontologySpaceBehaviorType.ts`
- 修改：`src/views/SpaceBehaviorWorkspace/utils/buildBasicFunctionCreateActionParams.ts`
- 修改：`src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- 修改：`src/views/SpaceBehaviorWorkspace/utils/mapOntologyActionInfoToFormState.ts`
- 修改：`tests/ontology-space-behavior.test.mjs`

## 核心实现方式

1. 新增 writeBack 相关请求类型。
2. QUERY：writeFields → writeBack（对象一致、sourceField、非 main 带 targetStorageGroup）。
3. AGGREGATE：multiWriteField → writeBack（单 binding、无 targetStorageGroup）。
4. 选属性时写入 storageGroup；详情 writeBack 回填表单。

## 新增依赖及必要性

无

## 验证方式

TDD 相关测试；format；types-conventions；build:verify。
