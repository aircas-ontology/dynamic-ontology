# 空间概念模型构建页面

## 需求理解

新增空间概念模型构建页面，并将本体空间新建弹窗中的“基于概念模型创建”入口接入该页面，页面视觉参考原型概念模型构建页。

## 修改范围

- 新增概念模型构建页及其基础 UML 组件面板、建模画布、说明面板和工具栏交互。
- 新增工作区命名路由 `/workspace/ontology-space-management/conceptual-model-create`。
- 调整空间新建弹窗的概念模型模式为原型样式，增加进入画布按钮。
- 复用现有布局、主题变量、Aircas 公共样式和 Element Plus 组件，不新增依赖或后端接口。

## 文件变更

- 新增 `src/views/OntologyConceptualModelCreate/index.vue`
- 修改 `src/router/modules/workspaceRoutes.ts`
- 修改 `src/views/OntologySpaceManagement/components/SpaceFormDialog.vue`
- 修改 `src/views/OntologySpaceManagement/index.vue`
- 修改 `src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts`
- 新增 `tests/ontology-conceptual-model-create.test.mjs`

## 核心实现方式

使用命名路由跳转概念模型页面；弹窗通过 `open-conceptual` 事件通知父层，父层关闭弹窗后导航。概念模型页提供可拖拽语义组件卡片、画布节点添加/删除、选中状态、缩放和清空等前端交互，数据暂存于页面状态。

## 新增依赖

无。

## 验证方式

执行概念模型专项测试、全量测试与覆盖率检查、类型检查、构建验证、当前任务文件格式检查，并检查路由与页面差异、空白错误和受保护目录边界。
