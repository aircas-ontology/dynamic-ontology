# Plan：新建保存改用 POST（修复误走 PUT）

确认范围（用户 2026-09-24「确认」）。

## 需求理解

新建函数算子保存应 POST `/ontology/function`。当前用 `draft.id` 判断编辑，弹框标题用 `editingOperator`；新建时表单残留上次编辑的 `id`，误走 PUT。

## 修改范围

| 操作 | 路径                                                                                         |
| ---- | -------------------------------------------------------------------------------------------- |
| 修改 | `useFunctionOperatorWorkspace.ts`（`editingOperator` 区分创建/更新）                         |
| 修改 | `FunctionOperatorFormDialog.vue`（新建重置清除 `id`）                                        |
| 修改 | `tests/update-ontology-function-api.test.mjs`、`tests/create-ontology-function-api.test.mjs` |

## 核心实现

- `saveOperator`：`editingOperator` 存在 → PUT 更新；否则 → POST 创建
- 打开新建：`createEmptyDraft` / 赋值后删除 `form.id`

## 新增依赖

无。

## 验证方式

相关单测、`format:check`
