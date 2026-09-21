# 本体对象删除接口与列表删除计划

## 需求理解

根据在线 `OntologyMetaController_deleteOntology` 契约生成删除本体对象接口说明，并在本体对象列表接入删除流程。点击对象删除按钮打开二次确认弹窗，确认后调用 `DELETE /meta/{ontologyIdentifier}`；成功后关闭弹窗、提示成功并重新加载分类树和对象列表，失败显示接口错误信息。

## 修改范围

- 新增删除接口说明、请求类型和响应 Mock。
- 在对象管理 API 与公共出口增加删除接口。
- 将同一 API 文件中查询和修改接口路径统一为已确认的 `/meta/category`、`/meta` 契约，创建接口继续使用 `/ontology/meta`。
- 新增对象删除确认弹窗并接入对象列表删除按钮。
- 增加删除接口契约和删除交互测试。

## 文件

- 新增：`docs/20260919/deleteOntologyObjectApi-guoshengnan.md`
- 新增：`src/types/apis/deleteOntologyObjectType.ts`
- 新增：`src/mocks/deleteOntologyObjectMock/deleteOntologyObjectMock.ts`
- 新增：`tests/delete-ontology-object-api.test.mjs`
- 新增：`src/views/OntologySpaceManagementDetail/components/OntologyObjectDeleteDialog.vue`
- 修改：`src/apis/ontologyObjectManageApi.ts`
- 修改：`src/apis/index.ts`
- 修改：`src/types/index.ts`
- 修改：`src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`

## 核心实现方式

- 删除接口使用 `DELETE /meta/{ontologyIdentifier}`，本体 id 通过 `params` 组装路径，不发送请求体。
- 查询和修改接口路径与既有契约测试及在线文档保持一致，避免删除后刷新或编辑流程继续调用旧路径。
- 删除弹窗展示对象名称和不可恢复提示，确认按钮有提交中状态并阻止重复请求。
- 接口成功只依据在线契约的 `code === 200` 判定；成功后调用工作区 `load()` 刷新列表。
- API 错误和业务失败消息显示在确认弹窗中。

## 新增依赖

- 无。

## 验证方式

- 先运行删除接口和删除交互测试确认失败，再完成实现并运行相关测试。
- 执行 `npm run check:types-conventions`、`npm run type-check`、`npm run build:verify`、任务文件范围内格式检查和 `git diff --check`。
