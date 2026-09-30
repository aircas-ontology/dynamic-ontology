# Plan：对象详情子路由按 objectId 强制重挂载

## 需求理解

全局检索点击「属性」后 URL 已变为 `/ontology-object/{id}/attribute?...`，但主内容仍显示上一对象属性页。根因：同 Tab（`OntologyObjectDetailAttribute`）下仅 `objectId`/query 变化时，子组件被 Vue 复用，`onMounted` 不重跑。

## 修改范围

- `src/views/OntologyObjectDetail/index.vue`：子 `router-view` 的 `<component>` 增加 `:key="objectId-routeName"`。
- 相关单测断言 key 存在。

## 新增依赖

无。

## 验证方式

- `node --test tests/ontology-object-attribute-panel.test.mjs`
- `npm run format:check --` 涉及文件
