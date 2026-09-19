# 本体空间管理迁移（已确认）

## 需求与范围
新增左侧菜单及/workspace/ontology-space-management布局子路由，迁移原型欢迎区、统计卡片、搜索排序、表格/卡片、分页和创建编辑删除导入导出弹窗。先接入Aircas公共样式再恢复结构。
详情、子空间和概念模型页面不迁移，入口明确提示尚未接入。使用内存Mock，刷新恢复数据，不引入权限系统或依赖。

## 文件
新增src/views/OntologySpaceManagement/index.vue及私有components、composables、utils；src/types/pages/ontologySpaceManagementType.ts；src/mocks/ontologySpaceManagementMock/ontologySpaceManagementMock.ts；src/assets/pages/ontologySpaceManagement/images；src/router/modules/workspaceRoutes.ts；tests/ontology-space-management.test.mjs。
修改src/router/index.ts、src/layout/components/NavigationMenu.vue、BreadcrumbBar.vue、src/types/index.ts；恢复src/mocks/readme.md。不修改html和public。

## 验证
TDD验证搜索排序分页、创建编辑删除、导入导出及重复提交；运行npm test、test:coverage、type-check、build:verify、check:project-conventions、check:types-conventions，检查diff与工作区。浏览器验证菜单路由、双主题、折叠与窄屏。
