# 属性筛选条件按类型录入

## 需求理解

第三步属性表把「验证条件」改为「筛选条件」。按数据类型展示对应控件：Date 为时间段，String 为文本输入，Double 等数值为数字输入，Boolean 为是否选择。

## 修改范围

- 新增 `resolveSubspaceCreatePropertyFilterKind.ts`：把数据类型映射为筛选控件。
- 修改属性映射，去掉固定的「未选择」文案。
- 修改 `SubspaceCreateWorkspacePanel.vue`：筛选条件列按类型渲染控件，并保存在当前页。
- 更新 `tests/ontology-subspace-create.test.mjs`。

## 新增依赖

无。

## 验证

TDD 后跑子空间创建测试、任务文件 `format:check`、`type-check`、`build:verify`。
