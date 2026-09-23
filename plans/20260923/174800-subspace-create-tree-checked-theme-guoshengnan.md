# 分类树选中样式改主题色

## 范围

- 仅改 `SubspaceCreateTreePanel.vue` 局部选中/勾选样式，不改 `src/styles/` 公共覆盖。
- 勾选框与勾选/当前行使用 `--aircas-color-accent-cyan`、`--aircas-color-accent-cyan-fill`、`--aircas-color-title`。
- 树保留 `aircas-tree`，并开启 `highlight-current`。

## 验证

- TDD：`tests/ontology-subspace-create.test.mjs` 断言勾选变量与 `:deep(.el-tree-node.is-checked)`。
- `npm run format --` 仅任务文件；`type-check`、`build:verify`。
