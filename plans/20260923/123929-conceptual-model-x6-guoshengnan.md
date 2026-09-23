# 需求理解

- 概念模型画布改为原型同款 AntV X6。
- 可以从对象连接点拖到另一个对象的连接点建立关系。
- 同一个对象可以建立多条关系，不能从自己连回自己。
- 保留现有保存接口、检查器、组件库和空间路由上下文。

# 修改范围

- 新增 X6 图配置和画布组件，替换 `index.vue` 中的手写 SVG 画布。
- 不改保存请求体、空间名称字段和检查器字段。
- 不删除尚未接入页面的旧 SVG 组件。

# 文件范围

## 新增

- `src/views/OntologyConceptualModelCreate/utils/conceptualModelGraph.ts`
- `src/views/OntologyConceptualModelCreate/components/ConceptualModelGraphCanvas.vue`

## 修改

- `package.json`
- `package-lock.json`
- `src/views/OntologyConceptualModelCreate/index.vue`
- `tests/ontology-conceptual-model-create.test.mjs`

## 删除

- 无。

# 核心实现方式

- 使用 `@antv/x6` 3.1.7。对象是带四边连接点的 HTML 节点，关系是边。
- `allowMulti: true`，`allowLoop: false`。连到两个不同对象才写入关系。
- 图实例用普通变量保存，卸载时 `dispose`。
- 页面对象 id 仍为数字，图内节点 id 使用 `obj-` / `rel-` 前缀。

# 新增依赖

- `@antv/x6@3.1.7`：原型画布库，当前仓库没有等价实现。

# 验证方式

- 概念模型页面契约测试。
- 对本次文本文件执行格式化检查。
