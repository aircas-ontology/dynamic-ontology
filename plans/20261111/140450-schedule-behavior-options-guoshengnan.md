# 调度行为数据源

- 需求：当前空间行为列表替换样例选项，过滤 BASE 基础行为。
- 范围：调度页面、表单、页面私有加载模块及 tests/*.test.mjs。
- 实现：复用 getListOntologyActionInterface，每页1000条，遍历分页；加载、空、失败重试和过期响应保护；保留现有名称值存储兼容性。
- 新增依赖：无。
- 验证：先失败测试，再实现；npm test、test:coverage、type-check、build:verify、format:check、diff检查。
