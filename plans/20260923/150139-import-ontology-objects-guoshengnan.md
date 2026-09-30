# 对接本体对象导入接口

## 需求理解

本体对象创建弹窗选择「导入创建」、选择文件并点击确认后，调用 `docs/20260923/5.importOntologiesApi.md` 中的 `POST /ontology/meta/import`。请求体为 `multipart/form-data` 的 `file`。成功后关闭弹窗、提示并刷新对象列表。

## 修改范围

- 增加导入参数、响应类型、接口函数和文档中的结构 Mock。
- 导入确认改为提交所选文件，不再在本地解析 JSON 并追加对象。
- 手动创建、模板下载和创建方式文案保持不变。

## 新增、修改和删除文件

- 新增 `src/types/apis/importOntologiesType.ts`
- 新增 `src/mocks/importOntologiesMock/importOntologiesMock.ts`
- 新增 `tests/import-ontologies-api.test.mjs`
- 修改 `src/types/index.ts`
- 修改 `src/apis/ontologyObjectManageApi.ts`
- 修改 `src/apis/index.ts`
- 修改 `src/views/OntologySpaceManagementDetail/components/OntologyObjectCreateDialog.vue`
- 修改 `src/views/OntologySpaceManagementDetail/composables/useObjectWorkspaceObjectActions.ts`
- 修改 `src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`
- 修改 `tests/ontology-object-create-dialog.test.mjs`

## 核心实现方式

`postImportOntologiesInterface` 把 `file` 放入 `FormData` 后 POST。未选择文件时不发请求。响应 `code` 不是 200 时展示返回消息。成功提示「导入成功」并重新加载分类树与对象列表。

## 新增依赖

- 无

## 验证方式

- 先运行导入契约测试，确认当前实现失败，再完成最小修改并复跑。
- 对本次修改文件执行格式检查，并执行类型约定检查、类型检查和 `npm run build:verify`。
