# 右侧三块边框背景

## 需求理解

顶栏、步骤栏、第一步区域使用与截图一致的圆角卡片：`--aircas-color-border` 描边、`--aircas-color-panel-background` 背景。不改高度、文案、表单和公共样式。

## 修改范围

- `SubspaceCreateWorkspacePanel.vue` 三块增加共享 `__panel` 样式。
- `tests/ontology-subspace-create.test.mjs` 断言边框与背景。

## 新增依赖

无。

## 验证

TDD 后跑 `ontology-subspace-create` 测试、任务文件 `format:check`、`type-check`、`build:verify`。
