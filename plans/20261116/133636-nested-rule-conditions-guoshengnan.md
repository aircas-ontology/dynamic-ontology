# 多级条件分组转换

- 需求：将页面多级条件树转换为创建接口的括号数量和连接符，支持用户确认的整数 `isLeft`、`isRight`。
- 范围：修改规则创建参数类型、条件转换及相关测试；新增本方案，无文件删除，不影响其他已有工作。
- 实现：递归按顺序展开每组；非根组的首项增加左括号、末项增加右括号，同一项可累加多层；相邻子项以父组的 AND/OR 连接，末项无连接符。拒绝任何空组；if/else 保持整体取反方式。
- 文件：`src/types/apis/createBehaviorScheduleType.ts`、`src/views/SpaceBehaviorScheduleWorkspace/utils/buildRuleScheduleCreateParams.ts`、`tests/rule-schedule-create.test.mjs` 和本方案。
- 依赖：无新增依赖。
- 验证：先新增测试并确认失败，覆盖示例、多级、单项组、空组及真假组合，验证 if/else；执行相关测试、全量测试、覆盖率、类型规范、类型检查、临时构建、格式和 diff 检查；浏览器或真实接口未执行时说明。
- 已获用户确认。
