# 基础函数编辑回显无过滤条件时不展示空行

## 需求理解

编辑基础函数回显时，若详情 `queryConfig` 无过滤条件，参数配置区不应展示空的一行过滤表单。

## 修改范围

- `mapOntologyFunctionQueryConfigToBasicFilter`：无 filters 返回空 children
- `mapDetailToDraftDefinition`：无 queryConfig 同样不垫空 FILTER
- 补充 detail 映射测试

## 新增、修改和删除文件

**修改**

- `src/utils/functionOperatorBasicFilter.ts`
- `src/utils/mapOntologyFunctionDetail.ts`
- `tests/get-ontology-function-detail-api.test.mjs`

## 核心实现方式

回显路径使用 `{ logic: "AND", children: [] }`；新建默认仍用 `createEmptyBasicFilterDocument()`。

## 新增依赖

无。

## 验证方式

- `node --test tests/get-ontology-function-detail-api.test.mjs tests/basic-filter-op-options.test.mjs tests/create-ontology-function-api.test.mjs`
- `npm run format:check -- <本任务文件>`
- `npm run build:verify`
