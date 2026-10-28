# 智能管理助手改为挤压布局

## 需求理解

当前 AI 助手使用 `el-drawer`（`append-to-body`、`modal=false`）浮在页面之上，遮挡主内容。需改为打开时挤压当前页面：助手与页面并排完整显示，主内容区域变窄但仍可完整滚动查看。

## 修改范围

- 修改：`src/layout/index.vue`
- 修改：`src/layout/components/NavigationMenu.vue`
- 修改：`src/layout/components/AiAssistantDrawer.vue`
- 不新增依赖；不改聊天逻辑 / composable / 对话组件行为
- 嵌入态（无导航）保持现状：无启动入口、不展示助手栏

## 核心实现方式

1. `layout/index.vue`：`assistantVisible` + 打开时第三列 620px grid + 挂载 `AiAssistantDrawer`
2. `NavigationMenu.vue`：仅保留启动按钮，`v-model:assistant-visible`
3. `AiAssistantDrawer.vue`：去掉 `el-drawer`，改为布局内 `aside`（标题栏 + 关闭），`defineModel` 控制显隐

## 新增依赖及必要性

无。

## 验证方式

- 人工：打开/关闭助手，确认主内容变窄且不被遮挡
- `npm run format:check --` 上述三个文件
- `npm run type-check`（区分既有失败与本次新增）
