# 智能助手展开收起动画

## 需求理解

助手已改为布局内挤压，但开闭仍是 `v-show` 瞬时显隐。需要展开/收起带平滑动画，主内容同步被挤压/还原。

## 修改范围

- 修改：`src/layout/index.vue`
- 修改：`src/layout/components/AiAssistantDrawer.vue`
- 不改 `NavigationMenu`、聊天逻辑；无新增依赖

## 核心实现方式

aside 宽度 0↔620px 过渡 + 布局第三列 `auto`；去掉 `is-assistant-open` 的 620px 硬切与 `v-show`。

## 新增依赖及必要性

无。

## 验证方式

- 人工：打开/关闭助手，确认宽度过渡与主内容同步挤压
- `npm run format:check --` 上述两个文件
- `npm run type-check`（区分既有失败）
