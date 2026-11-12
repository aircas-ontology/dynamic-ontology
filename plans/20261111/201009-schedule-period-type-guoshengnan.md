# 调度周期类型提交与回显

用户确认周期类型传递与回显方案，随后明确修订：提交使用文档枚举DAILY/WEEKLY/MONTHLY/CRON。

- 修改src/types/apis/createBehaviorScheduleType.ts：task.periodType为枚举；详情类型getBehaviorSchedulingDetailType.ts补充顶层及taskVO周期类型。复用编辑请求继承结构。
- 修改页面utils/buildBehaviorScheduleCreateParams.ts，将前端每天/每周/每月/Cron映射枚举；新增utils/restoreSchedulePeriod.ts，按类型恢复Cron中的时间/星期/月日期，严格验证可表示形态，异常或旧数据回退Cron原文，不猜测丢失约束。
- 修改页面index.vue详情映射，使用顶层periodType优先、taskVO回退；不再固定Cron。兼容读取历史中文值。
- 修改tests/schedule-create-params.test.mjs、tests/schedule-save-api.test.mjs、tests/shared-behavior-parameters.test.mjs，新增tests/schedule-period.test.mjs，TDD覆盖四类往返、枚举、6/7段Cron、中文、缺失未知和复杂表达式降级、编辑及查看。
- 更新docs/20261111/getSchedulingDetailApi.md和updateSchedulingApi.md，记录周期类型位置和枚举。
- 无新增依赖、无删除；保留已有变更，不触碰public/html。
- 验证针对测试、npm test/test:coverage、类型规范→type-check→build:verify、限定格式及diff。记录既有失败；无浏览器及人工验收。
