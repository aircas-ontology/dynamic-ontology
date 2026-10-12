# AI 助手对接流式对话

## 需求理解

AI 助手抽屉对接 `POST /chat/stream`。接口单独走 SSE，请求头带 `access-token`。状态放项目级 composable。构建页不改。

已确认：

1. `thinking` / `tool_call` / `tool_result` 折叠为过程区，正式回复只拼 `content`。
2. 没有 `datasourceId` 就不传。
3. 新对话只换前端 `sessionId`，不调 `clear_context`。
4. `OntologyLlmBuilder` 保持原样。

UUID 用 `crypto.getRandomValues` 生成 v4，兼容 Chrome 90+ 和非 HTTPS 内网。

## 修改范围

流式对话契约、UUID 工具、助手 composable、AI 助手抽屉。不改构建页、子空间创建、`public/`、`html/`。

`AGENT_URL` 由开发人员写入 `public/configs/domainConfig.js`。类型增加可选 `AGENT_URL?`。

## 新增、修改和删除文件

- 新增 `src/utils/generateUuidV4.ts`
- 新增 `src/utils/buildStreamAgentChatParams.ts`
- 新增 `src/utils/applyAssistantChatEvent.ts`
- 新增 `src/types/apis/streamAgentChatType.ts`
- 新增 `src/types/agent/aiAssistantChatType.ts`
- 新增 `src/apis/agentChatApi.ts`
- 新增 `src/composables/agent/useAiAssistantChat.ts`
- 新增 `src/mocks/streamAgentChatMock/streamAgentChatMock.ts`
- 新增 `src/layout/components/AiAssistantConversation.vue`
- 新增 `tests/ai-assistant-chat.test.mjs`
- 修改 `src/types/global/runtimeConfigType.ts`
- 修改 `src/types/index.ts`
- 修改 `src/apis/index.ts`
- 修改 `src/layout/components/AiAssistantDrawer.vue`

## 核心实现方式

- API 使用已有 `@microsoft/fetch-event-source`，不走 `request()`。
- 未登录不发请求。有登录令牌时写 `access-token`。
- composable 从路由读取 `spaceId`；不传 `datasourceId`。
- 抽屉只编排 UI，请求和状态在 composable。

## 新增依赖及必要性

无。

## 验证方式

- TDD：先写 UUID、入参省略、新对话换 sessionId、过程折叠、重复发送与取消的失败测试
- `npm test`、`npm run test:coverage`
- `npm run check:types-conventions`、`npm run type-check`、`npm run build:verify`
- 任务文件 `format:check`
