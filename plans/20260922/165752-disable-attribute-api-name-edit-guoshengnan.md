# 编辑属性时禁用 API 名称

## 需求理解

新增属性时 API 名称仍可填写；编辑已有属性时显示原 API 名称，但禁止修改。

## 修改范围

- 根据 `editingAttributeId` 设置 API 名称输入框禁用状态。
- 增加测试覆盖新增与编辑模式的差异。

## 文件变更

- 修改 `src/views/OntologyObjectDetail/components/AttributePropertyFormDialog.vue`。
- 修改 `tests/ontology-object-attribute-panel.test.mjs`。
- 不修改接口、类型、依赖、`public/` 或 `html/`。

## 核心实现方式

API 名称输入框绑定 `:disabled="editingAttributeId !== null"`。编辑提交继续携带回显的原始 `apiName`，满足现有接口类型要求。

## 依赖

不新增依赖。

## 验证方式

- 先增加编辑禁用契约测试并确认旧实现失败，再修改组件使其通过。
- 执行属性面板定向测试、格式检查、类型检查、验证构建及 `git diff --check`。
