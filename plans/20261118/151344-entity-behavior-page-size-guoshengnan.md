# 实例详情行为每页 12 条（已确认）

- 需求：实例详情行为默认分页从 8 改为 12 条。
- 范围：修改 src/views/EntityBrowsingObjectProfile/composables/useObjectProfileEntityDetail.ts 和相关 tests/object-profile-entity-detail.test.mjs；新增本 Plan，无删除、无依赖变化。
- 实现：调整现有 behaviorPageSize 为 12，请求与分页控件继续共享该值，首次查询、翻页、分类筛选都保持 12 条；现有 total > pageSize 控制分页条，11 条结果无需翻页。
- 验证：先更新分页请求测试并确认旧值 8 导致失败，再修改实现；运行相关测试、npm test、test:coverage、type-check、build:verify、限定文件格式检查和 git diff --check。保留既有失败证据，不扩展修复其他问题。无浏览器工具，实际布局由人工验收。
- 边界：保留会话其他工作，不读取 html，不修改 public，不使用 Subagent。

## 验证结果

- TDD：更新分页断言后观察到 8 !== 12 失败；调整常量后相关 35 项测试全部通过，覆盖首次加载、翻页及分类筛选的 pageSize=12。
- 全量测试 1184 项，1138 通过、46 项既有失败，与上一轮失败名称比较无新增。
- 覆盖率为已加载文件行 93.41%、分支 78.86%、函数 90.41%；分支未达 80%，覆盖率检查未通过，不能表述为全项目源码覆盖率。
- 类型检查仍有其他文件的 14 项既有错误，本任务无新增类型错误。
- build:verify、限定文件 format:check、git diff --check 通过。未进行浏览器验证，人工验收待进行。
