# 需求理解

规则画布打开时默认展示开始节点、条件分支和执行行为，并按顺序连接。

# 修改范围

- 明确默认规则流工厂创建条件分支及其 then 执行行为。
- 更新规则画布测试验证默认节点结构。

# 文件

- 修改 `src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowFactory.ts`
- 修改 `tests/behavior-schedule-rule-canvas.test.mjs`

# 依赖

不新增依赖。

# 验证

执行规则画布测试、格式检查和 diff 检查。
