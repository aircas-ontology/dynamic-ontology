# 按原有页面重建子空间创建页

## 需求理解

按已清空前的子空间创建页和当前截图重建页面：左侧分类体系树，右侧名称/步骤/空状态。样式优先公共 `aircas-*`。左右拆成页面内部组件。不改公共主题，不接新接口。

## 修改范围

- 重建 `OntologySubspaceCreate` 页面内容和内部组件。
- 路由、空间列表入口、空间详情 `isWorkflowPage` 不改。
- 不改 `src/styles/`、`public/`、`html/`，不引用其他页面私有组件。

## 新增、修改和删除文件

- 修改：`src/views/OntologySubspaceCreate/index.vue`
- 新增：`src/views/OntologySubspaceCreate/components/SubspaceCreateTreePanel.vue`
- 新增：`src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue`
- 修改：`tests/ontology-space-management-detail.test.mjs`
- 新增：`tests/ontology-subspace-create.test.mjs`
- 新增依赖：无

## 核心实现方式

1. `index.vue` 只做左右编排、父空间名称、子空间/API 名称和下一步校验。
2. 左栏：搜索、全选/清空、`el-tree` 使用 `aircas-tree` / `aircas-input` / `aircas-button`，树数据沿用原页面示例。
3. 右栏：返回/父空间/下一步、`aircas-form` 名称字段、四步流程、第一步空状态使用 `aircas-empty`。
4. 本步仍只做对象勾选；下一步沿用原提示，不实现后三步。

## 验证方式

先补失败测试断言左右组件和公共 class，再实现并通过相关测试。格式检查仅覆盖本任务文件。
