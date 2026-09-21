# 对象工作区面板交互函数拆分

## 需求理解

将 `ObjectWorkspacePanel.vue` 中分类树与本体对象相关的交互函数抽到页面级 composable；面板保留布局编排与树/列表定位；行为与接口调用不变。

## 修改范围

- `src/views/OntologySpaceManagementDetail/composables/`：新增两个 actions composable
- `src/views/OntologySpaceManagementDetail/utils/objectWorkspace.ts`：补充纯函数
- `src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`：改为组合调用
- 相关源码断言测试

## 新增、修改和删除文件

新增：

- `src/views/OntologySpaceManagementDetail/composables/useObjectWorkspaceCategoryActions.ts`
- `src/views/OntologySpaceManagementDetail/composables/useObjectWorkspaceObjectActions.ts`

修改：

- `src/views/OntologySpaceManagementDetail/utils/objectWorkspace.ts`
- `src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`
- `tests/ontology-category-tree-api.test.mjs`
- `tests/create-ontology-object-api.test.mjs`
- `tests/update-ontology-object-api.test.mjs`
- `tests/delete-ontology-object-api.test.mjs`
- `tests/ontology-object-create-dialog.test.mjs`
- `tests/ontology-object-query-api.test.mjs`（若断言仍依赖面板脚本则同步调整）
- `tests/ontology-object-workspace.test.mjs`（若断言仍依赖面板脚本则同步调整）

删除：无

## 核心实现方式

1. 分类弹窗状态与 open/submit/confirm 抽到 `useObjectWorkspaceCategoryActions`。
2. 对象创建/编辑/删除/导入抽到 `useObjectWorkspaceObjectActions`。
3. `incrementCategoryCount`、`collectCategoryOptions` 等纯函数放入 `objectWorkspace.ts`。
4. 面板保留 `viewMode`、定位状态、`handleAction` 与模板编排。

## 新增依赖及必要性

无。

## 验证方式

- 更新并运行上述相关测试
- `npm run type-check`
- `npm run format:check -- <任务文件列表>`
- `npm run build:verify`
