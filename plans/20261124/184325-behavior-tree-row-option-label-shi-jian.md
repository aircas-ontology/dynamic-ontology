# 行为树执行子表行选项 pageSize 与属性值展示

## 需求理解

- loadBehaviorTreeGroupRowOptions 的 pageSize 由 200 改为 10。
- 下拉选项标签除行主键外，拼接该行 props 的 propertyValue。

## 修改范围

行为树执行行候选加载与标签生成；相关测试。不改分页翻页 UI。

## 新增、修改和删除文件

- 修改：mapOntologyEntityRowDetailToDataRows.ts（导出标签格式化）、useBehaviorTreeExecution.ts
- 修改：BehaviorTreeExecPanel.vue（无选项时的回退标签尽量用同一格式或保持「行 id」）
- 新增/修改：tests 覆盖标签与 pageSize
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. 导出 formatOntologyEntityRowDetailPageRecordLabel：`行 {主键} · 名=值；…`（最多 3 个属性）。
2. loadBehaviorTreeGroupRowOptions：pageSize=10，用该函数生成 label。
3. ExecPanel 已选缺失选项仍回退为 `行 {id}`。

## 新增依赖及必要性

- 无

## 验证方式

- npm test 相关用例；format:check；build:verify（若改动应用代码）
