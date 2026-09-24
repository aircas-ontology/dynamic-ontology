# Plan：全文检索页输入框旁增加检索按钮

## 需求理解

在全文检索页搜索框右侧（红框位置）增加「检索」按钮，点击触发与回车相同的检索逻辑。顶栏浮层搜索不加按钮。

## 修改范围

- `src/components/OntologyGlobalSearchField/OntologyGlobalSearchField.vue`：`placement === "page"` 时在输入框旁渲染 `aircas-button`「检索」。
- 相关单测断言按钮存在。

## 新增依赖

无。

## 验证方式

- `node --test tests/ontology-global-search.test.mjs tests/full-text-search.test.mjs`
- `npm run format:check --` 涉及文件
