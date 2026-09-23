# 修复本体空间导入文件请求体

## 需求理解

新建本体空间选择“导入创建”并上传文件后，当前请求将浏览器 `File` 对象放入 JSON 请求体，导致服务端收到空文件参数。需要按文件上传协议提交 `multipart/form-data`，确保文件字段包含实际文件内容。

## 修改范围

- 将本体空间导入 API 的请求体由普通对象改为 `FormData`，字段名保持 `file`。
- 修正导入接口说明，明确请求体为 `multipart/form-data`。
- 更新导入接口契约测试，验证使用 `FormData` 并追加文件字段。
- 导入弹窗选择、成功关闭、提示和刷新列表流程保持不变。

## 新增、修改和删除文件

- 修改 `src/apis/ontologyManageApi.ts`
- 修改 `docs/20260923/3.importOntologySpaceApi.md`
- 修改 `tests/import-ontology-space-api.test.mjs`

## 核心实现方式

`postImportOntologySpaceInterface` 创建 `FormData`，调用 `append("file", params.file)` 后以 `multipart/form-data` 提交到 `/ontology/space/import`。页面继续传入选中的 `File`，不改变响应处理和列表刷新逻辑。

## 新增依赖

- 无

## 验证方式

- 先运行导入接口契约测试，确认当前 JSON 实现不满足文件上传要求。
- 完成实现后运行该契约测试、相关格式检查、类型检查、构建验证和 `git diff --check`。
