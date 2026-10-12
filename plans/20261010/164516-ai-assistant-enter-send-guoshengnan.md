# AI 助手回车发送

## 需求理解
AI 助手对话编辑框按 Enter 发送消息，Shift+Enter 保留换行，并兼容现有 Ctrl+Enter 发送；输入法组合输入期间不触发发送。

## 修改范围
- 修改 `src/layout/components/AiAssistantDrawer.vue` 的输入框键盘处理和提示文案。
- 更新 `tests/ai-assistant-chat.test.mjs`，增加键盘行为源码回归断言。

## 新增依赖
无。

## 验证方式
- 格式检查
- AI 助手专项测试
- `npm run type-check`
- `npm run build:verify`
- `git diff --check`
