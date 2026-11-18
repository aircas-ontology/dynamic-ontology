# Plan：基础函数行为表单移植「聚合类型 / 聚合参数名」

## 需求理解

行为类型为「基础函数」时，在参数配置上方展示聚合类型与聚合参数名；保存仍 defer。

## 修改范围

- `BehaviorFormDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

## 核心实现方式

复用 `FUNCTION_OPERATOR_AGG_FUNC_OPTIONS`；本地状态 `basicFunctionAggFunc` / `basicFunctionTargetField`；未选聚合类型时禁用并清空参数名。

## 新增依赖

无

## 验证方式

`node --test tests/ontology-space-behavior.test.mjs`；`format:check` 改动文件
