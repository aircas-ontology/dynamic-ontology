# 同步函数列表接口入参改造

## 需求理解

`type` 改为 `types`/`excludeTypes`；query 扁平传参。

## 修改范围

- `getOntologyFunctionListType.ts`、`functionApi.ts`
- 调用点：`useFunctionOperatorWorkspace.ts`、`BehaviorFormDialog.vue`、`FunctionOperatorFormDialog.vue`
- 相关测试

## 新增依赖及必要性

无。

## 验证方式

相关 node --test、format:check、types-conventions、build:verify。
