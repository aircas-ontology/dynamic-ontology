# 浏览行为详情右侧按类型切换公共组件

## 需求理解

浏览页行为「详情」：左侧统一行为详情；右侧按行为类型挂不同公共组件。行为树用独立组件，其它类型用现有测试公共能力。

## 修改范围

- 为 `BehaviorTreeTestDialog` 增加 `showBehaviorDetailPanel`（默认 `false`）。
- 浏览侧打开行为树时开启左栏；管理侧不传。
- 左栏展示行为详情摘要；右侧仍为 `BehaviorTreeExecPanel`。
- 非行为树右侧逻辑保持现状。

## 新增、修改和删除文件

| 操作 | 路径 |
|------|------|
| 修改 | `src/components/BehaviorTreeTestDialog.vue` |
| 修改 | `EntityBrowsingBehavior/index.vue`、`ObjectProfileEntityDetail.vue` |
| 修改 | `tests/behavior-tree-test-dialog.test.mjs`、`tests/entity-browsing-behavior-workspace.test.mjs` |
| 新增 | 本 Plan |

## 核心实现方式

1. `showBehaviorDetailPanel === true`：左右分栏；左详情、右 `BehaviorTreeExecPanel`。
2. 默认 `false`：仅树执行面板。
3. 浏览两处对树弹窗传 `show-behavior-detail-panel`。

## 新增依赖及必要性

无。

## 验证方式

相关单测 + format。
