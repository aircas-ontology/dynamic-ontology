# AI 助手步骤对话归属

## 需求理解

步骤条中的对话按消息产生时的进行中步骤展示。创建过程中发送的用户消息归入发送时的当前步骤，不依据回复正文内容调整归属；已完成步骤使用绿色状态。

## 修改范围

- 为构建组记录每条消息产生时的步骤序号。
- 各步骤只渲染归属于自身的消息。
- 保留现有步骤状态模型并强化完成状态绿色样式。
- 增加步骤归属与完成颜色测试。

## 文件

- 修改 `src/layout/components/AiAssistantConversation.vue`。
- 修改 `tests/ai-assistant-chat.test.mjs`。

## 核心实现方式

构建分组中的消息转为带 `stepIndex` 的条目：助手消息使用自身 `buildProgress.current`，用户消息使用当时构建组最新步骤；模板按步骤过滤条目。步骤状态沿用 `resolveAssistantBuildProgress`，完成步骤增加绿色文本、边框和连线样式。

## 依赖

不新增依赖。

## 验证方式

运行 AI 助手定向测试、相关文件格式检查、类型检查、构建验证和 `git diff --check`。
