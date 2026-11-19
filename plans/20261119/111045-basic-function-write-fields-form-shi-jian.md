# 基础函数展示字段联动写入字段表单

## 需求理解

基础函数单对象时：展示「展示字段」并隐藏聚合类型/聚合参数名；展示字段有值时，按字段数生成写入字段（对象+属性，对齐应用行为 WRITE_PROPERTY）。本轮只做表单与校验，不改创建接口请求体。

## 修改范围

- `src/types/pages/ontologySpaceBehaviorType.ts`
- `src/types/index.ts`（如需导出）
- `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- `src/views/SpaceBehaviorWorkspace/utils/mapOntologyActionInfoToFormState.ts`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan
- 无新增依赖；不改 `buildBasicFunctionCreateActionParams` 请求体字段

## 核心实现方式

草稿增加 `basicFunctionWriteFields`；单对象时隐藏聚合表单并清空聚合值；按 `basicFunctionSelectFields` 同步写入行并预填当前对象；提交校验每行对象与属性。

## 新增依赖及必要性

无。

## 验证方式

- 更新并运行相关 ontology-space-behavior 测试
- `npm run format:check -- <任务文件>`
- `npm run check:types-conventions`、`npm run type-check` / `build:verify`（视变更）
