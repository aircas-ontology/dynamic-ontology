# 对接本体空间导入接口

## 需求理解

新建本体空间弹窗选择「导入创建」、选择文件并点击确定后，调用 `POST /ontology/space/import`。请求和响应按 `docs/20260923/3.importOntologySpaceApi.md` 对接：请求体为带 `file` 的对象，不改成 `FormData`。

## 修改范围

- 增加导入参数、字符串数组响应类型和成功 Mock。
- 在本体空间管理 API 中增加导入请求。
- 导入模式提交选中的文件；成功后关闭弹窗并刷新空间列表。
- 手动创建、图标上传和导入模板下载保持现有行为。

## 新增、修改和删除文件

- 新增 `src/types/apis/importOntologySpaceType.ts`
- 新增 `src/mocks/importOntologySpaceMock/importOntologySpaceMock.ts`
- 新增 `tests/import-ontology-space-api.test.mjs`
- 修改 `src/types/index.ts`
- 修改 `src/apis/ontologyManageApi.ts`
- 修改 `src/apis/index.ts`
- 修改 `src/views/OntologySpaceManagement/components/SpaceFormDialog.vue`
- 修改 `src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts`
- 修改 `src/views/OntologySpaceManagement/index.vue`

## 核心实现方式

`postImportOntologySpaceInterface` 使用 `request`，方法 `post`，`data` 为 `{ file }`。弹窗保存选中的 `File`，确定时调用该接口。`code === 200` 时通知页面关闭弹窗、提示导入成功并重新加载列表；失败时在弹窗内展示 `message`。

## 新增依赖

- 无

## 验证方式

- 先运行导入契约测试确认当前实现失败，再完成最小修改并复跑。
- 对本次修改文件执行格式检查。
