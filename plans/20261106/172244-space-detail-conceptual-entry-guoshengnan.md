# 需求理解

在对象空间详情顶部标签栏右侧增加概念构建按钮，进入当前空间的概念画布。

# 修改范围

- 修改 `src/views/OntologySpaceManagementDetail/index.vue` 和页面私有 `components/WorkspaceTypeTabs.vue`，增加入口与跳转。
- 修改 `tests/ontology-space-management-detail.test.mjs`，验证当前空间参数、切换和缺失状态。
- 新增本计划，不删除文件，不修改接口或依赖。

# 核心实现方式

标签栏提供右侧操作区域，详情页使用已加载的当前空间 ID、名称和 API 名称构造概念构建路由，保留来源及嵌入式 query。空间未就绪和已有工作流页面不显示按钮，窄屏保留标签横向滚动。

# 新增依赖

无。

# 验证方式

先增加行为测试并确认失败，再实现；执行相关测试、全量测试、覆盖率、类型检查、临时目录构建、格式和 diff 检查。可用时验证浏览器交互与布局。
