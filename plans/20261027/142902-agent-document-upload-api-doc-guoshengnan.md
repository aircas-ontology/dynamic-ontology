# Agent 文档上传接口说明

## 需求理解

根据内网 Agent 服务 Knife4j/OpenAPI 定义，为会话参考文档上传接口生成项目现有格式的 Markdown 接口说明。

## 修改范围

- 新增 `docs/20261027/uploadAgentDocumentApi.md`。

## 核心实现方式

记录接口来源、操作标识、请求方法和路径、`sessionId` 查询参数、`multipart/form-data` 文件字段、支持的文件类型、响应模型及示例。响应字段以 `DocumentUploadVO` OpenAPI 定义为准。

## 新增依赖

无。

## 验证方式

执行新增 Markdown 的 Prettier 格式检查和 `git diff --check`；本次仅新增文档，不执行应用类型检查、构建或行为测试。
