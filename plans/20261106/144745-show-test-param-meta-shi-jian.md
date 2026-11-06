# 函数算子测试展示参数类型与描述

## 需求理解

函数算子测试弹框为每个绑定参数展示 `paramType`、`description`。行为创建表单不动。

## 修改范围

- `src/utils/mapOntologyFunctionTest.ts`：新增 `OntologyFunctionTestBindingRow`、`buildOntologyFunctionTestBindingRows`
- `useFunctionOperatorWorkspace.ts`：`testBindingKeys` → `testBindingRows`
- `FunctionOperatorPanel/index.vue`：展示类型与描述
- 更新相关测试

## 新增依赖

无

## 验证方式

- `node --test tests/test-ontology-function-api.test.mjs tests/function-operator-workspace.test.mjs`
- `npm run format:check -- <本次文件>`
- `npm run type-check`、`npm run build:verify`
