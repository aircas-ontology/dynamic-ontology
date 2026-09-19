# Plan：分类树为空时展示添加入口

确认范围（用户 2026-09-18「确认」）。

## 需求理解

`/ontology/category/tree` 返回 `code: 200` 且没有 `data` 时，对象页展示「添加分类树」按钮；点击后弹框输入「主分类名称」。确认只校验并关闭，不调创建接口。

## 修改范围

- `useOntologyObjectWorkspace.ts`：无 `data` 时返回空状态，不映射、不记 error
- `ObjectWorkspacePanel.vue`：empty 展示按钮并打开弹框
- 新增 `CategoryTreeCreateDialog.vue`

## 新增依赖

无。

## 验证方式

相关测试 + `type-check`
