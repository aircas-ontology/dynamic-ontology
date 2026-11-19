# 空间浏览行为仅展示已发布

## 需求理解

空间浏览「行为」Tab 只显示已发布行为，与对象详情对象行为一致，不展示草稿。

## 修改范围

- 列表与 Tab 计数请求固定 `status: 1`
- 去掉浏览侧「行为状态」筛选
- 更新相关测试

## 新增、修改和删除文件

| 操作 | 路径                                                                       |
| ---- | -------------------------------------------------------------------------- |
| 修改 | `useEntityBrowsingBehaviorWorkspace.ts`、`useEntityBrowseBehaviorCount.ts` |
| 修改 | `BehaviorInstancePanel.vue`、`EntityBrowsingBehavior/index.vue`            |
| 修改 | `tests/entity-browsing-behavior-workspace.test.mjs`                        |
| 新增 | 本 Plan                                                                    |

## 核心实现方式

列表与角标查询始终传 `status: 1`；移除 statusFilter 状态与 UI。

## 新增依赖及必要性

无。

## 验证方式

更新测试断言请求带 `status: 1`；`npm test -- tests/entity-browsing-behavior-workspace.test.mjs`；任务文件 format:check。
