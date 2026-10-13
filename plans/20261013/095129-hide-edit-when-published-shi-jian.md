# Plan: 已发布不展示编辑按钮

## 需求理解

`status === "published"` 的函数不可编辑：列表卡片与表格操作列不展示「编辑」按钮。

## 修改范围

- `src/views/FunctionOperatorPanel/index.vue`
- `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts`
- `tests/function-operator-workspace.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件
- 新增 / 删除：无

## 核心实现方式

1. 卡片操作区与表格操作列：编辑按钮增加 `v-if`，已发布不展示。
2. `openEdit` 对已发布状态早退并提示。
3. 测试断言面板与 workspace 源码包含 published 判断。

## 新增依赖及必要性

无。

## 验证方式

- 定向测试 + format:check
