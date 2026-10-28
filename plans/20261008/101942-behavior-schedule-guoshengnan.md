# 行为调度页面实施方案

## 需求理解
按照原型实现空间内管理的行为调度列表页面，按钮内部页面暂不生成，复用公共 Aircas 主题样式。

## 修改范围
- 新增行为调度工作区页面组件，包含查询栏、列表和操作按钮。
- 将空间内管理的行为调度子路由从空面板切换到新组件。
- 不新增依赖，不修改受保护目录。

## 文件
- 新增：src/views/OntologySpaceManagementDetail/behaviorScheduleComponents/SpaceBehaviorScheduleWorkspace.vue
- 修改：src/router/modules/workspaceRoutes.ts

## 核心实现方式
使用 Vue 3 Composition API 与 script setup，维护本地 Mock 调度数据和查询筛选状态；按钮暂显示提示，不跳转或生成内部页面；页面样式使用现有 --aircas-* 变量及 aircas-* 公共组件类。

## 新增依赖
无。

## 验证方式
执行 npm run type-check、npm run build:verify、npm run format:check -- <涉及文件>、npm run check:project-conventions、git diff --check。
