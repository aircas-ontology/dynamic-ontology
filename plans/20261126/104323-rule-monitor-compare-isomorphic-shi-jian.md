# 监测条件与属性比较同构对齐

## 需求理解

依据已更新的 `docs/20261124/api-action-scheduling-rule-params.md`：

- 组级 `monitorType`：`insert` / `update` / `delete`
- `judgeParams` 与属性比较同构：`leftOperate` + `rightOperate` + `condition`
- `leftOperate.type` 可为 `dynamic` 或 `fixed`
- 纯属性比较：不传 `monitorType`

前端需同步：配置条件 UI（类型左置、表单一致）、保存入参、详情/画布回显与测试。

## 修改范围

| 动作 | 文件                                                                                      |
| ---- | ----------------------------------------------------------------------------------------- |
| 修改 | `ScheduleRuleConditionEditor.vue`                                                         |
| 修改 | `ScheduleRuleConditionWireSurface.vue`                                                    |
| 修改 | `buildRuleScheduleCreateParams.ts`                                                        |
| 修改 | `restoreRuleScheduleDetail.ts`                                                            |
| 修改 | `ontologySpaceBehaviorScheduleType.ts`                                                    |
| 修改 | `createBehaviorScheduleType.ts`                                                           |
| 修改 | `scheduleRuleFlowFactory.ts`、`scheduleRuleFlowText.ts`、`validateRuleConditionEditor.ts` |
| 修改 | `tests/rule-condition-monitor.test.mjs` 及相关测试                                        |
| 新增 | `plans/20261126/104323-rule-monitor-compare-isomorphic-shi-jian.md`                       |

## 核心实现方式

1. 叶子一律比较表单；类型下拉写根 `monitorType`；类型固定最左。
2. 保存只序列化比较项；根有 `monitorType` 写入组级；禁止旧监测写出；残留 `monitor` 节点报错。
3. 回显：有 rightOperate+condition 走叶子；旧无比较符仍还原 monitor。
4. `RuleConditionMonitorType` 含 `update`。

## 新增依赖

无。

## 验证方式

- 相关 `node --test`
- format / type-check / build:verify
