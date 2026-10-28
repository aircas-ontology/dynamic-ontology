# Plan：聚合参数名 targetProperty

确认范围（用户 2026-09-28「确认」）。

## 需求理解

表单聚合类型旁新增「聚合参数名」（各 50%）；选中聚合类型后可填。对应 `queryConfig.targetProperty`；新建提交、编辑回显可改。put 与 create 共用 queryConfig 类型一并提交。

## 修改范围

| 操作 | 路径                              |
| ---- | --------------------------------- |
| 修改 | `createOntologyFunctionType.ts`   |
| 修改 | `ontologyFunctionOperatorType.ts` |
| 修改 | `functionOperatorBasicFilter.ts`  |
| 修改 | `mapOntologyFunctionDetail.ts`    |
| 修改 | `FunctionOperatorFormDialog.vue`  |
| 修改 | `useFunctionOperatorWorkspace.ts` |
| 修改 | 详情 Mock、相关单测               |

## 核心实现

- 有 aggFunc 且 targetProperty 非空才写入；清空聚合类型时清空参数名并禁用输入

## 新增依赖

无。

## 验证方式

相关单测、`format:check`
