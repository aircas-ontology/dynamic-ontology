# 行选项仅展示本参数属性值

## 需求理解

- 「多选 xxx 行」下拉不要再拼接该行全部/前 3 个属性。
- 只展示**当前入参**对应属性的 `propertyValue`。
- 匹配规则：优先用入参 `propertyDisplayName` 对 `props[].propertyDisplayName`；否则用 `param.key` / `param.paramName` 对 `props[].propertyApiName`。
- 标签格式定为：`行 {主键} · {该属性值}`；找不到对应属性时回退为 `行 {主键}`。
- 黑板「{storageGroup} 行」（非入参上下文）只显示 `行 {主键}`，不拼属性。
- 缺选项回退仍为 `行 {id}`。`pageSize: 10` 保持不变。

## 修改范围

行为树执行行候选的标签生成与 LIST 入参展示；相关测试。不改接口、分页 UI、提交 payload。

## 新增、修改和删除文件

- 修改：`src/utils/behaviorParameters/mapOntologyEntityRowDetailToDataRows.ts`
- 修改：`src/composables/behaviorTree/useBehaviorTreeExecution.ts`
- 修改：`src/components/BehaviorTreeExecPanel.vue`
- 修改：`tests/behavior-tree-group-row-options.test.mjs`
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. 扩展 `BehaviorTreeEntityOption` 可选 `props`，加载时写入 records 的 props，label 先设为 `行 {主键}`。
2. `formatOntologyEntityRowDetailPageRecordLabel(row, match?)`：有 match 时只取一条匹配 prop 的 `propertyValue` 拼进标签；无 match 时仅 `行 {主键}`。
3. `resolveInputParamRowOptions`：对缓存选项用当前 param 的 `propertyDisplayName` / `key` / `paramName` 调用 formatter 生成最终 label。
4. 黑板 `resolveGroupRowOptions` 继续使用缓存默认 `行 {主键}`。

## 新增依赖及必要性

- 无

## 验证方式

- 相关 `npm test`（标签匹配 / 回退 / pageSize 断言）
- `npm run format:check --` 任务文件
- `npm run type-check`、`npm run build:verify`（应用代码变更）
