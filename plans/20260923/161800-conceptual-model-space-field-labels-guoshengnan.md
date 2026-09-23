# 概念模型画布本体信息增加字段名

## 需求理解

概念模型画布顶栏的空间名称、API 名称目前只有输入框和 placeholder。展示时补上字段名，便于辨认这两项本体信息。

## 修改范围

- 只改实时页面 `OntologyConceptualModelCreate/index.vue` 顶栏两个输入框。
- 不改检查器、未挂载的 Topbar 组件、保存逻辑和路由预填。
- 不改 placeholder 和只读行为。

## 新增、修改和删除文件

- 修改：`src/views/OntologyConceptualModelCreate/index.vue`
- 修改：`tests/ontology-conceptual-model-create.test.mjs`
- 新增依赖：无

## 核心实现方式

每个输入外包一层带字段名的 `label`：空间名称、API 名称。字段名 12px、次要文本色，输入仍用 `aircas-input`。

## 验证方式

先补失败测试断言顶栏出现这两个字段名，再改页面并通过概念模型现有测试。格式检查仅覆盖上述文件。
