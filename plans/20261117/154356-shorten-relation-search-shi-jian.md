# 缩短关系名称搜索框

## 需求理解

行为表单「绑定关系 / 关系选择」中「按关系名称搜索」输入框过宽，改为适中固定宽度。

## 修改范围

仅 `BehaviorFormDialog.vue` 中 `.behavior-form-dialog__relation-search` 样式。

## 新增、修改和删除文件

- 修改：`src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`

## 核心实现方式

去掉 `flex: 1`，改为 `width: 240px`，小屏用 `max-width: 100%`。

## 新增依赖及必要性

无。

## 验证方式

`npm run format:check --` 该文件。
