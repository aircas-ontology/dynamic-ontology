# 调度调用日志真实接口

用户确认生成接口说明并对接调用日志。

- 新增docs/20261111/getSchedulingResultApi.md，GET /ontology/action/scheduling/result，id/type必填，pageNum/pageSize默认1/10，分页模型及日志字段与状态枚举。
- 新增src/types/apis/getBehaviorSchedulingResultType.ts并统一导出；修改apis/ontologyActionApi.ts、apis/index.ts添加查询。
- 修改SpaceBehaviorScheduleWorkspace/index.vue：点击调用日志查询真实数据，移除样例；父页管理分页、loading/error/empty、重试、重复请求、关闭/切换调度/切换空间/卸载过期响应。
- 修改BehaviorScheduleInvocationLogDialog.vue：加宽为min(1100px,94vw)，显示触发/完成时间、状态、消息，通过展开行显示完整请求参数和执行结果；支持10/20/50/100条分页，默认10。
- 修改tests/schedule-save-api.test.mjs，先失败后实现，覆盖参数、分页、成功空错误重试、切换关闭及卸载；UI控件契约与行为测试结合，无E2E入口及浏览器工具，视觉人工验收待执行。
- 无新增依赖、无删除文件，保留已有修改，不触碰public/html。
- 验证npm test/test:coverage、类型规范→type-check→build:verify、限定格式与diff，记录既有失败。

补充验证维护：tests/behavior-schedule-create-dialog.test.mjs原日志断言要求固定样例日期和原型列名，按真实接口字段更新该相关断言；其余已有失败不修改。
