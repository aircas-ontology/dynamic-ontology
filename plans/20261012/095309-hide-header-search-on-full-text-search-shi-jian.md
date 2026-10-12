# Plan: 全文检索页隐藏顶栏检索框

## 需求理解

在全文检索页面（路由名 `FullTextSearch`）下，页面本身已提供检索框；顶栏 `HeaderBar` 中的全局检索框不再展示，避免重复。

## 修改范围

- `src/layout/components/HeaderBar.vue`：按当前路由名条件渲染检索区域。
- `tests/ontology-global-search.test.mjs`：断言顶栏在全文检索路由下按条件隐藏。

## 新增、修改和删除文件

| 操作 | 路径                                    |
| ---- | --------------------------------------- |
| 修改 | `src/layout/components/HeaderBar.vue`   |
| 修改 | `tests/ontology-global-search.test.mjs` |
| 新增 | 本 Plan 文件                            |

不修改全文检索页、检索组件、路由 path/name。

## 核心实现方式

1. 在 `HeaderBar` 中使用 `useRoute`（可配合 `computed`）。
2. 当 `route.name !== 'FullTextSearch'` 时渲染 `header-bar__search` 及其中的 `OntologyGlobalSearchField`。
3. 其它页面保持现有顶栏检索行为不变。

## 新增依赖及必要性

无。

## 验证方式

1. TDD：先更新测试并确认因未实现而失败，再实现并通过。
2. `npm test`（至少覆盖 `ontology-global-search` / `full-text-search` 相关）。
3. `npm run test:coverage`。
4. `npm run type-check`、`npm run build:verify`。
5. `npm run format:check --` 当前任务修改文件列表。
