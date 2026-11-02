# 空过滤条件时省略 filters

## 需求理解

保存基础函数时，`children` 为空则不传 `queryConfig.filters`；若同时无聚合字段，则整段不传 `queryConfig`。

## 修改范围

- `CreateOntologyFunctionQueryConfig.filters` 改为可选
- `buildOntologyFunctionQueryConfig` 空 children 不写 filters
- `saveOperator` 在无 filters/aggFunc 时省略 queryConfig

## 新增、修改和删除文件

- 修改 `src/types/apis/createOntologyFunctionType.ts`
- 修改 `src/utils/functionOperatorBasicFilter.ts`
- 修改 `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts`
- 修改 `tests/create-ontology-function-api.test.mjs`

## 核心实现方式

仅当 `doc.children.length > 0` 写入 filters；payload 仅在有 filters 或 aggFunc 时带 queryConfig。

## 新增依赖及必要性

无。

## 验证方式

更新断言后实现；跑相关测试、`format:check`、`type-check`、`build:verify`。
