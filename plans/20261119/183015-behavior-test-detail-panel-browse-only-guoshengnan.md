# 行为测试弹窗左侧详情仅浏览页展示

## 需求理解

全局 `BehaviorTestDialog` 左右分栏影响了空间行为管理等模块的「测试」弹窗。左侧「行为详情」仅应在空间浏览打开行为详情时出现；管理侧测试弹窗只保留右侧公用参数区。

## 修改范围

- `BehaviorTestDialog.vue`：新增开关，默认不展示左栏
- 浏览调用方开启左栏：`EntityBrowsingBehavior`、`ObjectProfileEntityDetail`
- `SpaceBehaviorWorkspace` 保持默认（无左栏）
- 更新相关测试断言

## 新增、修改和删除文件

| 操作 | 路径                                                                                          |
| ---- | --------------------------------------------------------------------------------------------- |
| 修改 | `src/components/BehaviorTestDialog/BehaviorTestDialog.vue`                                    |
| 修改 | `src/views/EntityBrowsingBehavior/index.vue`                                                  |
| 修改 | `src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityDetail.vue`              |
| 修改 | `tests/ontology-space-behavior.test.mjs`、`tests/entity-browsing-behavior-workspace.test.mjs` |
| 新增 | 本 Plan                                                                                       |

## 核心实现方式

1. 增加 `showBehaviorDetailPanel`（默认 `false`）。
2. `true`：左右分栏 + 宽弹窗；`false`：仅右侧执行区，弹窗宽度恢复测试场景常用宽度。
3. 浏览页详情传入 `:show-behavior-detail-panel="true"`；空间行为管理不传。

## 新增依赖及必要性

无。

## 验证方式

相关单测 + 任务文件 format；核对管理「测试」无左栏、浏览「详情」有左栏。
