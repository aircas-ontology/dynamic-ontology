# 已发布行为可打开编辑弹框只读查看

## 需求理解

行为处于不可编辑状态（如已发布）时，「编辑」按钮仍可点击并打开行为表单弹框查看内容；表单只读、不可保存。删除仍禁用。

## 修改范围

- `BehaviorListPanel.vue`：编辑按钮去掉 disabled
- `index.vue`：去掉打开编辑时的已发布拦截
- `BehaviorFormDialog.vue`：只读时标题为「查看行为」
- `tests/ontology-space-behavior.test.mjs`：同步断言

## 新增、修改和删除文件

- 修改上述文件；无新增/删除

## 核心实现方式

列表始终可点编辑 → 打开 `mode=edit` → 已有 `readonly`（published/disabled）禁用表单并隐藏保存/编排，页脚仅关闭。

## 新增依赖及必要性

无。

## 验证方式

更新相关测试；`format:check`；草稿可编辑，已发布可只读打开。
