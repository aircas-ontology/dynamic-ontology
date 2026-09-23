# 对接本体空间导出接口

## 需求理解

本体空间列表「更多」中的导出，改为调用 `GET /ontology/space/export`。在线文档只声明 HTTP 200，没有响应 schema。成功响应按文件下载处理，不再导出本地空间基本信息 JSON。

## 修改范围

- 增加导出查询参数类型和返回文件描述。
- 在本体空间管理 API 中增加导出请求，使用 blob 读取响应体和响应头。
- 确认导出时用当前空间 id 调用接口，并触发浏览器下载。
- 导出确认文案改为分类树、本体 schema 与实例数据，去掉“尚未接入”的说明。
- 不新增 Mock，不改导入模板下载。

## 新增、修改和删除文件

- 新增 `src/types/apis/exportOntologySpaceType.ts`
- 新增 `src/views/OntologySpaceManagement/utils/resolveExportOntologySpaceFileName.ts`
- 新增 `tests/export-ontology-space-api.test.mjs`
- 修改 `src/types/index.ts`
- 修改 `src/apis/ontologyManageApi.ts`
- 修改 `src/apis/index.ts`
- 修改 `src/views/OntologySpaceManagement/utils/downloadSpaceJson.ts`
- 修改 `src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts`
- 修改 `src/views/OntologySpaceManagement/components/SpaceCommandDialogs.vue`

## 核心实现方式

`getExportOntologySpaceInterface` 使用 `requestFull`，`responseType` 为 `blob`，查询参数为数字 `spaceId`。文件名优先取 `Content-Disposition`；没有时用空间 `apiName`，并按 `Content-Type` 补 `.json` 或 `.zip`。空间 id 不是整数时不发请求。失败保留弹窗并展示错误。

## 新增依赖

- 无

## 验证方式

- 先运行导出契约和文件名测试，确认当前实现失败，再完成最小修改并复跑。
- 对本次修改文件执行格式检查。
