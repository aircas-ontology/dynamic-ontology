# 调度行为参数允许未选数据行时添加

## 需求理解

新建和编辑调度时，应用行为参数与行为测试保持相同的空数据行添加逻辑：已选对象实例但未选非 main 存储分组数据行时，也允许点击「添加」并确认保存。保存的请求保留 `entityPrimaryKey`，省略该绑定的 `dataPrimaryKeys`。

范围同时覆盖周期调度，以及规则调度中的执行行为节点。已选数据行时请求结构不变，其他参数校验保持严格。

## 修改范围

- 周期调度应用行为参数的添加和确认保存。
- 规则调度执行行为节点应用行为参数的添加和确认保存。
- 共享参数控制器对空数据行快照的独立支持。
- 新建、编辑恢复、已选数据行和默认严格校验的行为测试。
- 不修改规则条件变量、行为树参数、接口类型、样式或其他校验。

## 新增、修改和删除文件

- 修改：`src/composables/behavior/useBehaviorParameters.ts`
- 修改：`src/views/SpaceBehaviorScheduleWorkspace/composables/useSchedulePeriodParameters.ts`
- 修改：`src/views/SpaceBehaviorScheduleWorkspace/composables/useRuleActionParameters.ts`
- 修改：`tests/shared-behavior-parameters.test.mjs`
- 修改：`tests/rule-action-parameters.test.mjs`
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. 两个调度参数控制器复用现有 `allowEmptyDataRow` 选项，允许已选实例、未选数据行时生成绑定记录。
2. 为请求构建和参数快照增加默认关闭的独立 `allowMissingDataPrimaryKeys` 选项，调度确认保存时显式开启；不复用测试执行的 `skipParamValidation`，避免跳过其他必要校验。
3. 收集绑定时，只有缺少非 main 数据行主键这一项被放宽；实例、外部参数、出参、关系及加载状态等其他校验不变。
4. 空数据行绑定的请求仅保留 `entityPrimaryKey`，不输出 `dataPrimaryKeys`；已选数据行及默认调用方维持原行为。
5. 现有编辑恢复逻辑已支持缺少 `dataPrimaryKeys`，直接复用，不扩大修改范围。
6. 先新增行为测试并确认失败，再完成最小实现。

## 新增依赖及必要性

- 无。

## 验证方式

- 相关测试：`tests/shared-behavior-parameters.test.mjs`、`tests/rule-action-parameters.test.mjs`，并回归行为测试参数用例。
- `npm test`
- `npm run test:coverage`，按脚本报告确认统计范围内行、函数、分支覆盖率均不低于 80%。
- `npm run type-check`
- `npm run build:verify`
- `npm run format:check -- <本次实际修改且受 Prettier 支持的文件列表>`
- `git diff --check`，检查任务相关 diff 与 `git status --short`。
- 当前无 E2E script；如开发环境可用，仅对新建、编辑调度的空数据行添加、保存与恢复做浏览器冒烟。业务结果及后端默认前十行行为由人工最终验收。
