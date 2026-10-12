# 生成流式对话 Api.md

## 需求理解

根据 `http://172.16.18.58:37003/agent/doc.html` 中 `AgentChatController_stream` 的 OpenAPI，只生成流式对话接口说明，不生成同步对话、清空上下文，也不实现 API / Types / Mocks。

## 修改范围

只新增一份 API Prompt。不修改 `src/`、`public/`、`html/`，不改用户已有的子空间创建改动。

## 新增、修改和删除文件

- 新增 `docs/20261010/1.streamAgentChatApi.md`
- 不修改、不删除其他文件

## 核心实现方式

- 按 `docs/readme.md` 与现有 `docs/20261009/1.createOntologySubspaceApi.md` 结构撰写
- 契约以 `http://172.16.18.58:37003/agent/v3/api-docs` 的 `POST /chat/stream` 为准
- domain 记录 OpenAPI server `http://172.16.18.58:37003/agent`；项目 `DOMAIN_CONFIG` 当前无 Agent 键
- 响应按 SSE `AgentChatStreamVO` 事件整理；`selection_request` 按字段说明收录
- 编译位置预留给后续实现，不在本次落地代码

## 新增依赖及必要性

无。

## 验证方式

- 只读对照 OpenAPI 字段、必填项和事件类型
- 对新增 Markdown 执行 `npm run format --` 与 `npm run format:check --`
- 纯文档，不跑单测、type-check、build:verify
