# Plan：已发布行为禁止编辑与删除（不含对象行为）

## 需求理解

空间行为工作区中，状态为 `published` 的行为不允许编辑、删除；状态管理/查看/测试仍可用。

## 修改范围

- `BehaviorListPanel.vue`
- `SpaceBehaviorWorkspace/index.vue`
- `BehaviorFormDialog.vue`
- 相关单测

## 新增、修改和删除文件

- 仅修改上述文件。

## 核心实现方式

列表禁用编辑与删除入口；打开函数对 published 拦截并提示；表单 readonly 含 published。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测、format:check
