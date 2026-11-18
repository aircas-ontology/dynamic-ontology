# 规则调度条件变量补选子表数据行

## 需求理解

规则调度画布「选择变量」弹窗：选到对象子表属性时，选完实例后再选该子表数据行。对齐行为测试：`main` 或空分组只选实例；非 `main` 再选数据行。接口动态操作数新增字段已确认为 `dataPrimaryKey`。

## 修改范围

仅改规则调度变量选择与条件提交：

- 变量目录保留属性 `storageGroup`
- 非 `main` 属性增加子表数据行选择
- `RuleVariableValue` 记录 `storageGroup`、`dataPrimaryKey`、展示标签
- 创建规则参数时非 `main` 写入 `dataPrimaryKey`；`main`/空不传

不改行为测试、应用入参、资产标准构建和 `public/`。不触碰无关工作区改动。

## 新增、修改和删除文件

修改：

- `src/types/pages/ontologySpaceBehaviorScheduleType.ts`
- `src/types/apis/createBehaviorScheduleType.ts`
- `src/views/SpaceBehaviorScheduleWorkspace/composables/useRuleVariablePicker.ts`
- `src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleVariablePicker.vue`
- `src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleValueEditor.vue`
- `src/views/SpaceBehaviorScheduleWorkspace/utils/buildRuleScheduleCreateParams.ts`
- `src/views/SpaceBehaviorScheduleWorkspace/utils/restoreRuleScheduleDetail.ts`
- `src/views/SpaceBehaviorScheduleWorkspace/utils/restoreRuleFlowDocument.ts`
- `src/views/SpaceBehaviorScheduleWorkspace/utils/hydrateRuleDetailVariableNames.ts`
- 对应单测（`schedule-rule-variable-picker`、`rule-schedule-create`、`rule-schedule-detail` 等）

无删除，无新依赖。

## 核心实现方式

1. 属性接口 `storageGroup` 写入目录。
2. `main` 或空分组只选实例；其他分组在实例选定后用 `postGetOntologyEntityRowDetailPageInterface` 分页加载数据行，选项展示数据行主键；换实例/属性清空已选行；未选行不能确认。
3. `RuleVariableValue` 增加 `storageGroup`、`dataPrimaryKey`、`dataPrimaryKeyLabel`。
4. 动态操作数保留 `OntologyId`、`entityId`、`propertyId`；非 `main` 再传 `dataPrimaryKey`。回显与详情恢复使用同一字段。

## 新增依赖及必要性

无。

## 验证方式

- 单测：`main` 不要求数据行；非 `main` 未选行不能确认；选中后操作数带 `dataPrimaryKey`；换实例清空数据行。
- 任务文件 `format:check`；应用变更后 `type-check`、`build:verify`。
