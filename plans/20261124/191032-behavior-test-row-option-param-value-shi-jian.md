# 行为测试数据行展示对应参数值

## 需求理解

- 行为测试弹框（`BehaviorParameterConfig`）中「请选择 orbit_point 数据行」下拉，当前只显示主键（如 `11424`）。
- 需要与行为树执行一致：展示**当前参数**对应属性的 `propertyValue`，格式 `行 {主键} · {属性值}`；匹配不到则仅 `行 {主键}`。
- 匹配：优先 `propertyDisplayName`，否则 `paramName` 对 `propertyApiName`。

## 修改范围

应用行为参数配置的数据行选项映射与标签；相关类型与测试。不改提交 payload、分页逻辑。

## 新增、修改和删除文件

- 修改：`src/types/behavior/behaviorParameterType.ts`
- 修改：`src/utils/behaviorParameters/mapOntologyEntityRowDetailToDataRows.ts`
- 修改：`src/composables/behavior/useBehaviorParameters.ts`
- 修改：`src/components/BehaviorParameterConfig/BehaviorParameterConfig.vue`
- 修改/新增测试：覆盖映射保留 props、按参数匹配标签
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. `BehaviorTestEntityDataRow.props?` 缓存分页行属性。
2. `mapOntologyEntityRowDetailPageToDataRows` 把 `record.props` 挂到行上。
3. `formatApplicationStorageGroupOptionLabel(row, param?)` 调用 `formatOntologyEntityRowDetailPageRecordLabel`。
4. 模板传当前入参行给 formatter。

## 新增依赖及必要性

- 无

## 验证方式

- 相关 `npm test`
- `npm run format:check --` 任务文件
- `npm run type-check`、`npm run build:verify`
- `npm run check:types-conventions`
