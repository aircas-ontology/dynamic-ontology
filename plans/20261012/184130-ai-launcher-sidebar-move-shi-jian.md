# Plan: AI 助手图标移至左侧菜单底部

## 需求理解

红框中的 AI 问答助手启动图标从页面右下角移到左侧菜单栏底部；对话面板仍为右侧 `el-drawer`（`direction="rtl"`），位置与交互不变。

## 修改范围

- `src/layout/components/AiAssistantDrawer.vue`（启动按钮定位样式）
- `src/layout/components/NavigationMenu.vue`（必要时）
- `tests/layout-navigation.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件
- 新增 / 删除：无

## 核心实现方式

1. `.ai-assistant-launcher` 改为侧栏内 `position: absolute; left: 50%; bottom: 24px; transform: translateX(-50%)`。
2. `NavigationMenu` 保持 `position: relative`；菜单列表 `flex: 1`。
3. `el-drawer` 继续 `append-to-body` + `direction="rtl"`。
4. 测试断言与侧栏底部定位一致。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/layout-navigation.test.mjs`
- format:check 任务文件
