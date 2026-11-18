# Plan：基础函数保存空值 trim 防护

## 需求理解

单对象可不选聚合类型（QUERY）；清空 select 后字段可能为 undefined，保存时不能对 undefined 调 trim。

## 修改范围

- `buildBasicFunctionCreateActionParams.ts`：字符串字段统一空串兜底
- `BehaviorFormDialog.vue`：草稿写入时规范化 agg/target
- 测试：覆盖 undefined 聚合字段仍可组装 QUERY

## 新增依赖

无

## 验证方式

`node --test tests/ontology-space-behavior.test.mjs`；format:check
