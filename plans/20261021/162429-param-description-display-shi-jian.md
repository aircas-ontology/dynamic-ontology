# 详情参数 description 展示

## 需求理解

详情接口 `params[].description` 需在详情抽屉「输入参数 / 输出参数」列表中展示。数据映射已有 description，补齐树节点透传与 UI。

## 修改范围

- `src/types/apis/parseOntologyFunctionParamsType.ts`
- `src/views/FunctionOperatorPanel/utils/mapOperatorParametersToScriptParamTree.ts`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorScriptParamTree.vue`
- `tests/map-operator-parameters-to-script-param-tree.test.mjs`、`tests/get-ontology-function-detail-api.test.mjs`

## 核心实现方式

1. `ParseOntologyFunctionParamItem` 增加可选 `description?: string`
2. `mapParameterFieldToScriptParamTreeNode` 非空时透传 description
3. `FunctionOperatorScriptParamTree` 在名称下方展示非空描述

## 新增依赖及必要性

无。

## 验证方式

映射测试、树源码契约、format:check、相关 npm test、check:types-conventions、type-check、build:verify。
