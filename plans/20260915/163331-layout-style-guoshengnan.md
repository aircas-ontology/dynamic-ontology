# 页面框架样式方案（用户已确认）

恢复标题栏品牌、搜索、工具三区结构；复用现有主题与公共菜单样式，恢复60/200px折叠和Workspace首页高亮。搜索及用户业务暂未接入，入口明确禁用。
修改 src/layout/index.vue、components/HeaderBar.vue、NavigationMenu.vue；新增布局图标资源和布局回归测试。不新增依赖、不修改公共主题和受保护目录。
验证：先失败测试再实现；npm test、test:coverage、type-check、build:verify、check:project-conventions及diff检查。
