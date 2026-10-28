# AI 助手对话类型修复与 SSE Mock 接入

## 需求理解
修复 AI 助手新增组件的 TypeScript 类型错误，并让本地 Mock 服务能够对 `/agent/chat/stream` 返回可消费的 SSE 事件流，支持正常和错误场景。

## 修改范围
- 修复 `src/layout/components/AiAssistantConversation.vue` 与 `AiAssistantPropertySelectionTable.vue` 的只读类型、模板窄化和 Element Plus 属性类型问题。
- 新增 Agent SSE fixture，扩展 `scripts/mock-server.mjs` 识别 SSE 路由并按事件逐条输出。
- 在 `src/mockData/routes.json` 注册 Agent 流式路由。
- 为 Mock SSE 路由增加测试，覆盖请求体读取、事件流响应头、正常事件和错误事件。

## 文件
- 修改：`src/layout/components/AiAssistantConversation.vue`
- 修改：`src/layout/components/AiAssistantPropertySelectionTable.vue`
- 修改：`scripts/mock-server.mjs`
- 修改：`src/mockData/routes.json`
- 修改：`tests/ai-assistant-chat.test.mjs`
- 新增：`src/mockData/fixtures/agent/chat.stream.post.json`

## 核心实现方式
- 选择卡片和属性表格辅助函数统一接受 `readonly` 选项与行数组。
- 模板中先提取并判断助手选择卡片，再向子模板传递已窄化的局部变量。
- 使用 Element Plus 支持的 `label` 属性提供复选框可访问名称。
- Mock 路由通过 `responseType: "sse"` 标识；服务读取 JSON 事件数组，以 `data: <json>\n\n` 输出并设置 `text/event-stream`。
- Mock 请求体完整读取但不写入状态，保持 fixture 确定性。

## 新增依赖
无，复用现有 Node HTTP 服务和 `@microsoft/fetch-event-source`。

## 验证方式
- `npm run check:types-conventions`
- `npm run format -- <任务文件列表>` 与 `npm run format:check -- <同一列表>`
- `npm test`
- `npm run test:coverage`
- `npm run type-check`
- `npm run build:verify`
- `git diff --check`
