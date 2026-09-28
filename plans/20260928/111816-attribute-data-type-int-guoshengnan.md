# 对象属性数据类型 Integer 改为 Int

## 需求理解

对象属性数据类型下拉中的 `Integer` 改为 `Int`。显示值与提交值保持一致。概念构建画布属性数据类型与对象属性表单保持同一套选项。

## 修改范围

仅替换数据类型选项字符串；不改接口、类型、依赖或布局。

## 新增、修改和删除文件

- 修改 `src/views/OntologyObjectDetail/composables/useAttributePropertyList.ts`
- 修改 `src/views/OntologyConceptualModelCreate/index.vue`
- 修改 `tests/ontology-object-attribute-panel.test.mjs`
- 修改 `tests/ontology-conceptual-model-create.test.mjs`
- 新增本 Plan 文件

## 核心实现方式

将 `dataTypes` 中的 `"Integer"` 替换为 `"Int"`。概念构建页中文映射 `整数` 同步改为 `"Int"`。

## 新增依赖及必要性

无。

## 验证方式

- TDD：先改测试期望为 `Int` 并确认失败，再改实现。
- 运行属性面板与概念构建相关测试、`format:check`、`type-check`、`build:verify`。
