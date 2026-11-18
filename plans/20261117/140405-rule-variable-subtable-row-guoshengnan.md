# 规则调度条件变量补选子表数据行

## 需求理解

规则调度画布的条件分支在「选择变量」弹窗中，选到对象子表属性时，选完实例后还要再选一次该子表的数据行。处理方式对齐行为测试和应用入参：存储分组为 `main` 或空时只选实例；非 `main` 时再选子表数据行。

当前不实施。调度动态操作数类型 `ScheduleRuleOperand` 只有 `OntologyId`、`entityId`、`propertyId`，没有子表行字段。待接口接收字段确认后再按本方案改代码。

## 修改范围

确认字段后仅改规则调度变量选择与条件提交：

- 变量目录保留属性 `storageGroup`
- 选择变量弹窗在非 `main` 属性下增加子表数据选择
- `RuleVariableValue` 记录存储分组、数据行主键和展示标签
- 创建规则参数时把已确认的接口字段写入动态操作数；`main` 属性不传该字段

不改行为测试、应用入参、资产标准构建和 `public/`。

## 新增、修改和删除文件

待接口字段确认后预计修改：

- `src/views/SpaceBehaviorScheduleWorkspace/composables/useRuleVariablePicker.ts`
- `src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleVariablePicker.vue`
- `src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleValueEditor.vue`
- `src/views/SpaceBehaviorScheduleWorkspace/utils/buildRuleScheduleCreateParams.ts`
- `src/views/SpaceBehaviorScheduleWorkspace/utils/restoreRuleScheduleDetail.ts`
- `src/views/SpaceBehaviorScheduleWorkspace/utils/restoreRuleFlowDocument.ts`
- `src/views/SpaceBehaviorScheduleWorkspace/utils/hydrateRuleDetailVariableNames.ts`
- `src/types/pages/ontologySpaceBehaviorScheduleType.ts`
- `src/types/apis/createBehaviorScheduleType.ts`
- 对应单测

无删除。无新依赖。具体文件以确认后的接口字段为准，扩大范围时重新确认。

## 核心实现方式

1. `getOntologyPropertyByOntologyIdInterface` 返回的 `storageGroup` 写入变量目录属性。
2. 选中 `main` 或空分组属性时，弹窗只保留「请选择实例」。
3. 选中其他分组时，实例选定后用 `postGetOntologyEntityRowDetailPageInterface` 按对象标识、实例主键和 `storageGroup` 分页加载子表行，选项展示数据行主键。更换实例或属性时清空已选行。未选行不能确认。
4. `RuleVariableValue` 增加 `storageGroup`、`dataPrimaryKey` 和展示标签。
5. 动态操作数继续传 `OntologyId`、`entityId`、`propertyId`。非 `main` 再传已确认的子表行字段。回显和详情恢复使用同一字段。

行为侧对照：`isMainStorageGroup` 判断是否需要数据行；非 `main` 行来自实体行详情分页，提交使用 `dataPrimaryKey`。

## 新增依赖及必要性

无。

## 验证方式

接口字段确认并实施后：

- 先补单测：`main` 属性确认不要求数据行；非 `main` 未选行不能确认；选中行后操作数带上约定字段；换实例清空数据行。
- 运行相关单测和任务文件 `format:check`。
- 应用代码变更再执行 `npm run type-check` 与 `npm run build:verify`。

## 暂停条件

已确认字段为 `dataPrimaryKey`，实施记录见 `plans/20261117/143443-rule-variable-subtable-row-guoshengnan.md`。
