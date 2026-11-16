# 规则编辑画布回显修复

- 需求：编辑调度时恢复已保存画布、条件和行为参数，修改后保留本地草稿，取消后重进恢复服务端原配置。
- 范围：规则详情到编辑草稿、编辑画布参数映射及行为参数恢复；不开放规则更新接口。
- 修改文件：SpaceBehaviorScheduleWorkspace/index.vue、BehaviorScheduleRuleConfigDialog.vue、ruleConfig/ScheduleRuleFlowDesigner.vue、composables/useRuleActionParameters.ts、BehaviorScheduleFormDialog.vue；对应 schedule-save-api、schedule-rule-node-editing、rule-action-parameters、rule-schedule-create 测试。新增本 Plan，无文件删除。
- 核心实现：将解析的单个完整画布克隆到草稿；编辑器传入保存的行为请求映射；当前行为与历史映射匹配才恢复，规则编辑不加载周期参数，最新已确认快照优先，避免历史参数覆盖修改。旧记录无 flowDocument 且只能恢复多个独立规则时明确提示，避免回填默认画布或伪造原始拓扑。
- 依赖：无新增。
- 验证：TDD 先失败后实现，测试编辑入口、嵌套结构、取消重开、参数恢复、切换行为及新快照优先；执行 npm test、test:coverage、type-check、build:verify、限定格式检查及 diff 检查。记录已有失败，浏览器和真实接口未验收则如实说明。
