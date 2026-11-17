# 实例详情行为列表启用状态筛选

- 需求理解：实例详情页行为列表请求增加 status: 1，仅查询启用行为。
- 修改范围：当前页面的行为列表请求及对应行为测试。
- 新增文件：本 Plan 记录。
- 修改文件：src/views/EntityBrowsingObjectProfile/composables/useObjectProfileEntityDetail.ts、tests/object-profile-entity-detail.test.mjs。
- 删除文件：无。
- 核心实现：在请求参数中增加 status: 1；先更新现有运行时测试，验证首次加载和翻页请求参数，确认失败后完成最小实现。
- 新增依赖：无。
- 验证方式：目标测试 RED/GREEN、npm test、npm run test:coverage、npm run type-check、npm run build:verify、任务文件 format:check、git diff --check 和范围检查。现有无 E2E 入口；人工验收待用户完成。
- 范围边界：保留用户已有 public/configs/domainConfig.js 修改，不触碰受保护目录。
