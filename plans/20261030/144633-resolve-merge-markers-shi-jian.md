# Resolve committed merge conflict markers

## 需求理解

当前分支工作区是 clean 的，但以下 3 个文件里仍残留已提交的冲突标记（`<<<<<<<` / `=======` / `>>>>>>>`），来自错误合并。任务是清掉标记并保留正确一侧，不扩大功能范围。

## 修改范围

仅修改这 3 个文件：

- `src/views/OntologyObjectAttributePanel/composables/useAttributePropertyList.ts`
- `src/views/OntologyObjectAttributePanel/components/AttributePropertyFormDialog.vue`
- `tests/ontology-object-attribute-panel.test.mjs`

## 新增、修改和删除文件

- 修改上述 3 个文件；无新增或删除文件

## 核心实现方式

1. `useAttributePropertyList.ts`：删除冲突标记与重复块，保留先取 `categoryId` 再按 `datasourceLocked` 分支返回的编辑参数逻辑。
2. `AttributePropertyFormDialog.vue`：保留 `el-tree-select`（与 `mapAttributeCategoryTreeSelectData` 及既有 Plan 一致）。
3. 测试：保留 tree-select 无 `:disabled=` 与 locked 编辑含 `categoryId` 的断言。

## 新增依赖及必要性

无。

## 验证方式

- `npm test`
- `npm run type-check`
- `npm run format:check --` 仅上述 3 个文件
- 确认仓库内无残留冲突标记
