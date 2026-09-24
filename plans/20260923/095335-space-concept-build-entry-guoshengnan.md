# 需求理解

- 在本体空间列表每个空间的“更多”菜单中增加“概念构建”入口。
- 点击入口后跳转到空间概念模型画布，并携带当前空间的显示名称和 API 名称。
- 画布中的空间名称和 API 名称显示当前空间信息且不可修改。

# 修改范围

- 扩展空间列表操作命令类型及下拉菜单。
- 扩展空间管理操作编排，将当前空间信息传给概念模型画布路由。
- 调整概念模型画布初始化与输入控件状态。
- 增加入口跳转和只读空间信息的测试。

# 文件范围

## 新增

- 无。

## 修改

- `src/types/pages/ontologySpaceManagementType.ts`
- `src/views/OntologySpaceManagement/components/SpaceActions.vue`
- `src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts`
- `src/views/OntologyConceptualModelCreate/index.vue`
- `tests/ontology-space-management.test.mjs`
- `tests/ontology-space-management-detail.test.mjs`（如需补充入口断言）

## 删除

- 无。

# 核心实现方式

- 新增 `conceptual-model` 空间操作命令。
- 使用命名路由 `OntologyConceptualModelCreate`，通过 query 传递 `spaceName` 和 `spaceApiName`。
- 画布页面从 `useRoute()` 读取 query；存在值时覆盖默认空间信息。
- 空间名称与 API 名称输入使用只读属性，保留展示和无障碍标签。

# 新增依赖

- 无。

# 验证方式

- 先运行新增定向测试确认当前实现失败，再完成最小实现并确认通过。
- 执行任务文件格式检查、类型目录检查、类型检查和验证构建。
- 交付前执行 `git diff --check` 与工作区范围核对。
