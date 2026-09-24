# Plan：函数算子删除确认框对齐 aircas-dialog

## 需求理解

函数算子删除由浅色 `ElMessageBox` 改为与对象模块一致的深色 `aircas-dialog`。

## 修改范围

- 新增 `FunctionOperatorDeleteDialog.vue`
- `useFunctionOperatorWorkspace`：`openDeleteOperator` / `confirmDeleteOperator`
- `FunctionOperatorPanel.vue` 挂载弹框（卡片 / 表格 / 抽屉）
- 更新删除相关单测

## 新增依赖

无。

## 验证方式

`node --test tests/delete-ontology-function-api.test.mjs tests/function-operator-workspace.test.mjs` + format:check
