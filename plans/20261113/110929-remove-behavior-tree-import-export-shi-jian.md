# 去除行为树编排导入/导出

## 需求理解

去掉编排页顶栏「导入/导出」按钮，并去掉对应的定义 JSON 导入/导出能力（右侧「定义 JSON」页、粘贴应用、复制等）。编辑态接口加载与保存校验保留。

## 修改范围

- `BehaviorTreeOrchestrationDialog.vue`
- `BehaviorTreeJsonPanel.vue`（删除）
- `useBehaviorTreeOrchestration.ts`
- `behaviorTreeOrchestrationType.ts`
- `readme.md`
- `tests/behavior-tree-orchestration.test.mjs`

## 新增、修改和删除文件

| 操作 | 路径                                       |
| ---- | ------------------------------------------ |
| 修改 | Dialog / composable / 类型 / readme / 测试 |
| 删除 | `components/BehaviorTreeJsonPanel.vue`     |
| 新增 | 本 Plan                                    |

## 核心实现方式

1. 删除顶栏「导入/导出」按钮与「定义 JSON」Tab。
2. 删除 JsonPanel 组件及其接线。
3. 移除 `definitionJson`、`payloadJson`、`applyBehaviorTreeDefinitionJson`；保存校验失败仅提示，不再切 json Tab。
4. `BehaviorTreeInspectorTab` 收窄为 `"node" | "board"`。

## 新增依赖及必要性

无。

## 验证方式

- 更新并运行 `behavior-tree-orchestration` 相关测试。
- format:check 任务文件。
- type-check / build:verify（适用时）。
