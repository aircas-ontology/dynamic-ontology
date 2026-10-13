# AI 助手本体构建步骤条纵向化方案（方案一）

## 需求理解

AI 助手抽屉中「大模型构建本体对象」的横向步骤条改为左侧纵向步骤轨展示，构建对话内容（过程、正文、选择卡片）嵌于步骤轨右侧。

## 修改范围

仅修改 `src/layout/components/AiAssistantConversation.vue`。

## 核心实现方式

1. 模板：带 `buildProgress` 的助手气泡改为两栏网格（`.ai-assistant-drawer__bubble--layout`，148px + 1fr）；左栏为纵向步骤轨（保留 `ai-assistant-drawer__build-steps` 类名并追加 `--vertical` 修饰符，竖向连接线 + 状态配色）；其余内容包入 `.ai-assistant-drawer__bubble-body` 右栏，顶部新增「第X步/共Y步」进度标签。非构建消息通过 `display: contents` 保持原渲染。
2. 脚本：`resolveAssistantVisibleContentBlocks` 过滤仅含【第X步/共Y步】标记的纯文本块，避免与进度标签重复展示。
3. 样式：新增纵向步骤轨（连接线、圆点遮线背景、暗亮主题）、两栏网格与进度标签样式。

## 新增依赖

无。

## 验证方式

纯展示样式修改，免自动化行为测试（现有测试仅断言 `ai-assistant-drawer__build-steps` 类名，保留不变）。执行 `format:check`、`npm test`（区分既有失败）、`type-check`（基线对比）、`build:verify`，浏览器人工验收暗/亮主题显示效果。
