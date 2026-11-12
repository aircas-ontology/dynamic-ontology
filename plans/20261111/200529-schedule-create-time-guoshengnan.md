# 调度列表创建时间字段

用户确认：将createTime映射到列表createdAt，原样展示，缺失显示“-”。

- 修改src/types/apis/listBehaviorSchedulingType.ts，增加可选createTime字符串字段（允许null响应）。
- 修改src/views/SpaceBehaviorScheduleWorkspace/utils/fetchBehaviorSchedules.ts映射创建时间，不转换时区或格式。
- 修改tests/schedule-list.test.mjs，先失败再实现，覆盖正常、缺失、null、空白值。
- 新增本计划，无删除，无新增依赖，保留已有修改，不触碰public/html。
- 验证针对测试、npm test/test:coverage、类型规范→type-check→build:verify、限定格式和diff检查；记录既有失败。无浏览器运行时验收。
