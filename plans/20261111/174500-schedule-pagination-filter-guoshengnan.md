# 行为调度服务端分页和筛选

用户已确认：名称 name 模糊筛选，策略映射 TASK/RULE；默认每页10条，可选10/20/50/100条；翻页请求接口，查询、重置和更改每页条数回到第一页。

- 修改 src/views/SpaceBehaviorScheduleWorkspace/index.vue、utils/fetchBehaviorSchedules.ts：单页查询，使用服务端total；保留已应用筛选条件、加载/空/错误/重试、过期响应和卸载保护；不重复进行前端模糊匹配。空间切换回第一页，保存刷新保留筛选。
- 修改 src/types/apis/listBehaviorSchedulingType.ts 增加name/type，复用现有类型，无新增依赖。
- 修改 tests/schedule-list.test.mjs、tests/schedule-save-api.test.mjs，先验证失败再实现，覆盖分页、筛选、重置、页大小、错误和过期请求。
- 更新 docs/20261111/listSchedulingApi.md。本计划为唯一新增文件，无删除，不触碰public/html，保留已有修改。
- 验证 npm test、test:coverage、类型规范→type-check→build:verify、限定格式、diff检查。记录既有失败；无E2E入口和可用浏览器控制工具，浏览器及人工验收待执行。
