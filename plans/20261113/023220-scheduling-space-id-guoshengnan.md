# 需求理解

为行为调度列表接口 `/ontology/action/scheduling/list` 增加 `spaceId` 查询参数，并为行为调度创建接口增加必填 `spaceId`。

# 修改范围

- 调整列表和创建请求参数类型。
- 页面列表查询使用当前路由空间 ID。
- 创建参数组装使用表单当前空间 ID。
- 更新接口与相关测试。

# 文件

- 修改 `src/types/apis/listBehaviorSchedulingType.ts`
- 修改 `src/types/apis/createBehaviorScheduleType.ts`
- 修改 `src/apis/ontologyActionApi.ts`
- 修改 `src/views/SpaceBehaviorScheduleWorkspace/index.vue`
- 修改 `src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleFormDialog.vue`
- 修改 `src/views/SpaceBehaviorScheduleWorkspace/utils/buildBehaviorScheduleCreateParams.ts`
- 修改相关 `tests/*.mjs`

# 核心实现

列表请求参数携带当前空间数字 ID；创建请求顶层携带当前空间数字 ID，并保留执行参数中的行为空间信息。

# 依赖

不新增依赖。

# 验证

运行相关调度测试、`npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`、格式检查和 `git diff --check`。
