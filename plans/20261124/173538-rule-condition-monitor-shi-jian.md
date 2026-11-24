# 条件分支支持属性比较 / 新增 / 删除三类触发

## 需求理解

- 属性比较（旧传值）：保持现有左值/运算符/右值，不传 monitorType。
- 新增 / 删除（新传值）：规则组带 monitorType insert|delete；条件项只选对象 + 存储分组（main 或子表分组）。
- 不做 monitorType=update 独立 UI。
- 同一条件分支根组内两种形态互斥；切换类型时清空不兼容子条件。

## 修改范围

- 类型、条件编辑 UI、创建/回显转换、画布摘要、相关测试。
- 不改调度列表、行为参数弹窗、Switch 分支协议。

## 新增、修改和删除文件

- 修改：ontologySpaceBehaviorScheduleType.ts、createBehaviorScheduleType.ts、types/index.ts（按需）
- 修改：ScheduleRuleConditionEditorDialog.vue、ScheduleRuleConditionEditor.vue（监测叶子 UI）
- 修改：scheduleRuleFlowFactory.ts、buildRuleScheduleCreateParams.ts、restoreRuleScheduleDetail.ts、restoreRuleFlowDocument.ts、摘要与实例绑定相关
- 新增/修改：tests 下 build/restore 与条件编辑断言
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. RuleCompositeCondition 增加可选 monitorType；新增 RuleMonitorLeafCondition 并入 RuleConditionNode。
2. 配置条件弹框根级 radio：属性比较 / 新增 / 删除；监测叶子仅对象 + 分组。
3. buildRuleJudgeItems 按根组 monitorType 输出监测项；校验同路径不混用；监测取反只翻组级 condition 与 AND/OR。
4. restore 识别 monitorType 或缺比较字段的条件项；flowDocument 优先回填。
5. 画布摘要如「新增 · 对象/分组」。

## 新增依赖及必要性

- 无

## 验证方式

- TDD：npm test、npm run test:coverage
- npm run type-check、npm run build:verify
- npm run format:check -- 任务文件列表
- 人工：三类切换与创建入参含 monitorType
