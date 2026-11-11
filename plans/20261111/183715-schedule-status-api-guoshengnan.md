# 行为调度启用停止状态按钮

用户确认：状态为START/STOP，列表状态列改按钮，点击乐观更新并请求启用/停用，失败恢复原状态。

- 先新增docs/20261111/startSchedulingApi.md、stopSchedulingApi.md，按POST路径type(TASK/RULE)、id(int64)说明，无body/query，RestResult响应。
- 新增src/types/apis/changeBehaviorSchedulingStatusType.ts；修改types/index.ts、apis/ontologyActionApi.ts、apis/index.ts，统一在线服务及请求封装。
- 修改SpaceBehaviorScheduleWorkspace/index.vue：已启用/已停止按钮，状态未知显示不可操作；按行防重复和加载；成功message提示，错误回退并提示。查询/翻页/筛选/空间切换/卸载使旧响应失效，避免污染新列表。
- 修改tests/schedule-save-api.test.mjs，TDD覆盖接口路径、START/STOP、TASK/RULE、成功失败回退、网络失败、重复、未知状态及过期响应。
- 无新增依赖、无删除；保留已有变更，不触碰public/html。
- 验证npm test/test:coverage、类型规范→type-check→build:verify、限定格式和diff检查；记录原有失败，无浏览器工具/E2E入口，运行时及人工验收待执行。
