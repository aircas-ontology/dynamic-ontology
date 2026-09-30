# 本体空间图标上传与 icon 参数对接计划

## 需求理解

创建/编辑本体空间时，用户选择图片后先调用缩略图上传接口拿到 URL，用于预览；提交时将该 URL 作为 `icon` 传给创建/更新空间接口。未上传图标不伪造地址。

## 契约确认

- `image` 使用 FormData，字段名为 `image`。
- 成功响应 `message` 以样例为准：`SUCCESS`。
- domain：`DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`，URI：`POST /ontology/file/thumbnail`，`data` 为缩略图 URL 字符串。

## 修改范围

- 新增缩略图上传 types、API、mock 与契约测试。
- 修改 `SpaceFormDialog`：选图后上传，成功写入 `draft.iconUrl` 并展示预览；上传中禁用相关操作并反馈失败。
- 放宽 `validateSpace` / 导出对 `iconUrl` 的校验，允许 `http(s)` URL，并保留导入场景的 base64 兼容。
- 创建/编辑提交已传 `icon: draft.iconUrl`，保持该路径；空字符串行为不变。

## 文件变更

新增：

- `src/types/apis/uploadOntologyThumbnailType.ts`
- `src/mocks/uploadOntologyThumbnailMock/uploadOntologyThumbnailMock.ts`
- `tests/upload-ontology-thumbnail-api.test.mjs`
- `tests/space-form-icon-upload.test.mjs`

修改：

- `src/apis/ontologyManageApi.ts`
- `src/apis/index.ts`
- `src/types/index.ts`
- `src/views/OntologySpaceManagement/components/SpaceFormDialog.vue`
- `src/views/OntologySpaceManagement/utils/spaceOperations.ts`（如校验需要）

## 核心实现方式

- API 函数 `postUploadOntologyThumbnailInterface` 接收 `{ image: File }`，组装 `FormData`，字段名 `image`；请求时使用 FormData，避免被默认 `application/json` 覆盖。
- 表单 `readIcon` 校验类型与 2MB 后调用上传接口；`code === 200` 时把 `data` 写入 `draft.iconUrl`。
- 清除按钮仍清空 `draft.iconUrl`。

## 依赖

不新增依赖。

## 验证方式

先运行失败测试，再完成最小实现。执行缩略图表单相关测试、`npm run check:types-conventions`、`npm run type-check`、任务文件格式检查；有应用代码变更时按规范执行 `npm run build:verify`。浏览器中在新建/编辑空间上传图片，确认预览为远程 URL，并在提交请求中看到 `icon` 为该 URL。
