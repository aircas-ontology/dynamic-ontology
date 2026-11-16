# 行为节点参数摘要修复

- 需求理解：行为参数已确认后，节点不再仅因旧 params 数组为空而提示“行为无参数”，尤其覆盖 Switch 分支行为。
- 修改范围：行为节点摘要工具和相关测试，不改接口、执行请求或参数组件。
- 修改文件：src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowFactory.ts；tests/behavior-schedule-rule-header-panels.test.mjs、tests/rule-action-parameters.test.mjs、tests/schedule-rule-switch-ports.test.mjs。新增本 Plan，无文件删除。
- 核心实现：有已确认快照时，优先依据 request 中固定输入、输入绑定、输出绑定和实例配置生成简短摘要；无填参项的已确认快照显示“参数已配置”。未确认且无旧参数时显示“未配置行为参数”，仍支持旧参数摘要。摘要仅读取配置，不修改执行数据。
- 新增依赖：无。
- 验证方式：TDD 先失败后实现；覆盖输入/输出绑定、实例主键为零、关系实例、无参数快照、旧参数回退、草稿不变、确认和重新打开，以及 Switch 节点重建后的实际摘要。执行 npm test、test:coverage、type-check、build:verify、限定格式和 diff 检查，区分原有失败；未进行浏览器及后端验收时说明。
