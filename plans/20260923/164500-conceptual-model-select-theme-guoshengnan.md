# 概念模型检查器下拉框改用公共样式

## 需求理解

概念模型创建页右侧检查器里的下拉框颜色不符合主题。改为使用已有公共 Select 覆盖。

## 修改范围

- 只改实时页面 `OntologyConceptualModelCreate/index.vue` 右侧四个 `el-select`。
- 不改输入框、未挂载的 Inspector 组件、全局 Select 覆盖。

## 新增、修改和删除文件

- 修改：`src/views/OntologyConceptualModelCreate/index.vue`
- 修改：`tests/ontology-conceptual-model-create.test.mjs`
- 新增依赖：无

## 核心实现方式

四个 `el-select` 的 class 从 `aircas-input` 改为 `aircas-select`，保留 `popper-class="aircas-select-popper"`。

## 验证方式

先补失败测试断言检查器下拉使用 `aircas-select`，再改页面并通过概念模型测试。格式检查仅覆盖上述文件。
