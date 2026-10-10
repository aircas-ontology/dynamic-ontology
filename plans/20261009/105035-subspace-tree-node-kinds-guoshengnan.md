# 子空间创建分类树节点区分实施方案

## 需求理解

创建子空间分类体系树中，分类节点显示文件夹图标；对象节点保持可选对象语义。勾选同步到右侧时只输出对象节点，不把分类节点当作对象卡片。

## 修改范围

- 修改 `SubspaceCreateTreePanel.vue` 的树节点类型、图标插槽和选中同步。
- 修改 `mapSubspaceCreateSelectedObject.ts`，仅映射对象节点。
- 更新 `tests/ontology-subspace-create.test.mjs`，覆盖节点分类和对象筛选行为。

## 核心实现方式

为树节点增加 `kind` 字段，分类节点使用 `category`，本体对象使用 `object`。使用 `el-tree` 的默认插槽为分类节点渲染文件夹图标；同步勾选节点时先过滤 `kind === "object"`，再映射右侧对象数据。

## 新增依赖

无。

## 验证方式

先运行定向测试确认旧实现失败，再执行定向测试、格式检查、类型目录检查、构建验证和 `git diff --check`。
