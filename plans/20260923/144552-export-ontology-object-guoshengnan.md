# 对接本体对象导出接口

## 需求理解

本体对象卡片和列表上的导出按钮，点击后调用 `docs/20260923/4.exportOntologyApi.md` 中的 `GET /ontology/meta/export`。查询参数为当前对象的 `uniqueIdentifier`。在线文档只声明 HTTP 200，没有响应 schema，因此成功结果按文件下载，不编造 JSON 字段，也不生成 Mock。

## 修改范围

- 增加导出查询参数和文件传输结果类型。
- 在本体对象管理 API 中增加导出请求，使用 blob 读取响应体和响应头。
- 卡片与列表共用的对象动作里，导出不再提示尚未接入，而是下载接口返回的文件。
- 不改按钮文案和布局，不新增确认弹窗。

## 新增、修改和删除文件

- 新增 `src/types/apis/exportOntologyType.ts`
- 新增 `src/views/OntologySpaceManagementDetail/utils/resolveExportOntologyFileName.ts`
- 新增 `src/views/OntologySpaceManagementDetail/utils/downloadOntologyFile.ts`
- 新增 `tests/export-ontology-api.test.mjs`
- 修改 `src/types/index.ts`
- 修改 `src/apis/ontologyObjectManageApi.ts`
- 修改 `src/apis/index.ts`
- 修改 `src/views/OntologySpaceManagementDetail/composables/useObjectWorkspaceObjectActions.ts`
- 修改 `src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`

## 核心实现方式

`getExportOntologyInterface` 使用 `requestFull`，`responseType` 为 `blob`，查询参数为字符串 `uniqueIdentifier`。对象 `id` 即列表映射出的唯一标识；为空时不发请求。文件名优先取 `Content-Disposition`；没有时用对象 `apiName`，并按 `Content-Type` 补 `.json` 或 `.zip`。导出进行中忽略重复点击。

## 新增依赖

- 无

## 验证方式

- 先运行对象导出测试，确认当前实现失败，再完成最小修改并复跑。
- 对本次修改文件执行格式检查，并执行类型检查和 `npm run build:verify`。
