# 调度已发布行为与输入筛选

用户已确认：调度行为列表仅查询已发布行为，选择框支持名称和 API 输入筛选。

- 修改 src/views/SpaceBehaviorScheduleWorkspace/utils/fetchScheduleBehaviorOptions.ts：每页请求增加 status: 1，保留 pageSize: 1000、分页、去重、基础行为排除，返回记录再次检查 status: 1。
- 修改 BehaviorScheduleFormDialog.vue：使用 Element Plus filterable；选项 label 已包含名称和 API，复用默认筛选；空状态提示更新为已发布非基础行为。
- 修改 tests/scheduleBehaviorOptions.test.mjs，先运行失败测试，再实施并通过；验证分页查询条件、草稿及基础行为排除、同名行为保留、空和错误状态。
- 选择框启用组件原生筛选，无自定义筛选逻辑；检查模板接线。无现有 E2E 入口，实际键盘输入、名称/API筛选和清空恢复需人工浏览器验收。
- 新增文件仅本 Plan，无删除、依赖、类型及公共配置变更。保留已有修改。
- 验证：针对测试、npm test、test:coverage、type-check、build:verify、限定格式检查和 git diff --check，分别记录已有失败。

## 验证结果

- RED 已确认原实现未传 status 且包含草稿、失效行为；实施后相关 29 项测试通过。
- npm test：931 项，899 通过、32 失败，失败名称与上次一致；type-check 13 项既有错误，排除行号偏移后与上次一致，无新增失败。
- test:coverage 已加载文件行 92.24%、函数 88.09%、分支 77.00%，分支低于 80%，检查未通过；不代表全项目源码覆盖率。
- build:verify、限定文件 format:check、git diff --check 通过。
- 选择框沿用名称及 API 的 label，并启用 filterable，静态接线检查通过；浏览器输入筛选、键盘与暗亮主题未运行，仍需人工验收。
