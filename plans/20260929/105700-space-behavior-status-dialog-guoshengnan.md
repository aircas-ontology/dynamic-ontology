# 空间内行为状态管理弹窗

## 需求理解

列表「更多」增加状态管理。弹窗按原型实现两步流程：先选目标操作并填写原因、查看引用检查，再确认变更。只改已保存行为的状态，不改 ID、参数和引用。本轮仍走本地 Mock。

## 修改范围

只改空间内行为列表的更多菜单和状态管理弹窗。不改对象详情行为 Tab、行为调度，不接后端。

## 新增、修改和删除文件

- 修改 `BehaviorListPanel.vue`：更多菜单增加「状态管理」
- 新增 `BehaviorStatusDialog.vue`：两步状态管理弹窗
- 修改 `SpaceBehaviorWorkspace.vue`：接线弹窗
- 修改 `ontologySpaceBehaviorType.ts`：状态增加 `disabled`，行为增加 `version`
- 修改 Mock：种子带版本；提供引用检查与状态变更
- 修改 `tests/ontology-space-behavior.test.mjs`

## 核心实现方式

目标操作按当前状态过滤。已发布可停用或转草稿；草稿可发布或停用；停用可发布或转草稿。引用检查本轮固定 0 项且检查通过。确认后只更新 `status` 和 `updatedAt`。

## 新增依赖及必要性

无。

## 验证方式

先补失败测试，再实现；跑行为页测试和 `format:check`。
