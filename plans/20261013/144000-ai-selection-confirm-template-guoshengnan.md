# AI 助手列表选择确认消息模板

## 需求理解

AI 助手步骤中的列表选择点击确认后，页面展示内容和回传模型的内容统一使用“已选择：名称（id=值）”模板。

## 修改范围

- 修改选择确认消息格式化工具，同时生成名称和 ID 信息。
- 修改确认事件使用统一格式消息进行页面展示和模型回传。
- 更新单选、多选相关测试。

## 文件

- 修改 `src/utils/toggleAssistantSelectionIds.ts`。
- 修改 `src/layout/components/AiAssistantConversation.vue`。
- 修改 `tests/ai-assistant-chat.test.mjs`。

## 核心实现方式

根据已选 ID 从选择卡片选项中查找显示名称，生成 `已选择：名称（id=值）` 文本；多个选项使用顿号连接。确认事件将该文本同时作为回传值和用户气泡展示值，保留未找到名称时使用 ID 的回退行为。

## 依赖

不新增依赖。

## 验证方式

运行 AI 助手定向测试、相关文件格式检查、类型检查、构建验证和 `git diff --check`。
