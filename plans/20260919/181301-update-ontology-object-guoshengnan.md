# 本体对象编辑接口与弹窗计划

## 需求理解

根据在线 `OntologyMetaController_updateMeta` 契约新增修改本体对象接口说明，并在对象列表页接入编辑流程。点击对象编辑按钮打开回显弹窗，保存调用 `PUT /meta`，成功后关闭弹窗、提示成功并重新加载分类树数据。

## 修改范围

- 新增 `docs/20260919/updateOntologyObjectApi-guoshengnan.md`，记录 `PUT /meta` 请求体、响应和实现示例。
- 新增修改接口类型与 Mock，并在 `src/apis/ontologyObjectManageApi.ts` 及公共出口中导出。
- 扩展 `OntologyObjectCreateDialog.vue` 支持 create/edit 两种模式；编辑模式回显对象基本信息、隐藏创建专属流程并提交编辑草稿。
- 在 `ObjectWorkspacePanel.vue` 保存编辑对象状态，处理编辑按钮、参数转换、提交中/失败提示及成功刷新。
- 增加接口契约与编辑交互测试。

## 文件

- 新增：`docs/20260919/updateOntologyObjectApi-guoshengnan.md`
- 新增：`src/types/apis/updateOntologyObjectType.ts`
- 新增：`src/mocks/updateOntologyObjectMock/updateOntologyObjectMock.ts`
- 新增：`tests/update-ontology-object-api.test.mjs`
- 修改：`src/apis/ontologyObjectManageApi.ts`
- 修改：`src/apis/index.ts`
- 修改：`src/types/index.ts`
- 修改：`src/views/OntologySpaceManagementDetail/components/OntologyObjectCreateDialog.vue`
- 修改：`src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`
- 修改：`tests/ontology-object-create-dialog.test.mjs`

## 核心实现方式

- `PUT /meta` 使用 `data` 发送 `ontologyIdentifier`、`displayName`、`groupIds` 及可选字段。
- 编辑弹窗通过 `editingItem` 回显现有列表对象；API 名称只读，分类可修改，父本体不提交给修改接口。
- 成功响应以 `code === 200` 且 `success === true` 判定，成功后关闭弹窗、显示消息并执行工作区 `load()` 刷新分类树及右侧对象列表。
- 通过提交状态阻止重复保存，接口错误写入弹窗错误区域。

## 新增依赖

- 无。

## 验证方式

- 先运行新增测试确认失败，再完成最小实现并运行相关测试。
- 执行 `npm run format:check`、`npm run check:types-conventions`、`npm run type-check`、`npm run build:verify`、`git diff --check`。
