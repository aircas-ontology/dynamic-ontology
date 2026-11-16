# 规则比较操作符调整

- 需求理解：按照更新的接口枚举支持包含、不包含，移除页面前置包含选项，暂不使用 CH。
- 修改范围：规则创建接口类型、比较符转换、条件选择器及相关测试。保留现有未提交工作。
- 新增文件：本方案；修改文件：createBehaviorScheduleType.ts、buildRuleScheduleCreateParams.ts、ScheduleRuleConditionEditor.vue、rule-schedule-create.test.mjs；无删除文件、无新增依赖。
- 实现方式：页面 contains、notContains 分别传 CONTAINS、NOT_CONTAINS；前置包含不再提供选择。保留历史值识别，以便旧数据明确提示重新选择，禁止静默转换；CH 暂不映射或提供选项。
- 验证方式：先更新测试并确认失败，再实施；运行相关测试、全量测试、覆盖率、类型规范、类型检查、临时构建、格式与差异检查；浏览器验证可用时执行，未执行则说明。
- 用户已确认。
