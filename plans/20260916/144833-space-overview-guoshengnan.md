# 空间概览实施方案（用户已确认）
新增私有 SpaceOverviewPanel.vue 并接入 overview 路由。还原五项资源统计、图标、说明及响应式布局，使用现有 Aircas 变量和私有纯色样式，不修改公共样式。
新增详情 Mock 模块，按空间 ID 提供确定性统计，复用正式类型。实现加载、空、错误、权限展示以及过期请求保护。
新增类型、页面 composable 与统计格式化工具、测试；不删除文件、不增加依赖。
先运行失败测试再实现，执行 npm test、test:coverage、check:types-conventions、check:project-conventions、type-check、build:verify 和 git diff --check。
