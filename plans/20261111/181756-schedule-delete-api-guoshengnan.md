# 行为调度删除接口对接

用户确认接口说明与删除对接，并要求二次确认：列表删除仅打开现有确认弹窗，点击确认删除才请求。

- 新增 docs/20261111/deleteSchedulingApi.md，说明 DELETE /ontology/action/scheduling/{type}/{id}，路径必填TASK/RULE和int64 id；标准RestResult响应，data未定义。
- 新增 src/types/apis/deleteBehaviorSchedulingType.ts；修改 src/types/index.ts、src/apis/ontologyActionApi.ts、src/apis/index.ts，统一在线服务与请求封装。
- 修改 src/views/SpaceBehaviorScheduleWorkspace/index.vue：按记录策略传type，保留确认弹窗；命令状态、防重复、失败保留与重试、接口message提示、空间切换/卸载过期响应保护。成功刷新当前筛选分页，删空页退上一页。
- 修改 tests/schedule-save-api.test.mjs，先失败再实现，覆盖接口路径、TASK/RULE、二次确认、成功失败重试、重复、页回退、空间切换卸载。仅自动化使用模拟接口，不调用真实删除。
- 无新增依赖、无删除，保留已有未提交变更，不触碰public/html。
- 检查npm test/test:coverage、类型规范→type-check→build:verify、限定格式及diff；无E2E入口，浏览器人工验收未执行须明确记录。
