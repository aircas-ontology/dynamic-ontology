# 属性分类改为非必填

## 需求理解

新增对象属性时，属性分类不再显示必填标识，也不执行必填校验；未选择分类时允许保存。

## 修改范围

- 删除属性表单规则中的 `categoryId` 必填规则。
- 增加测试确认分类字段保持展示但不再必填。

## 文件变更

- 修改 `src/views/OntologyObjectDetail/composables/useAttributePropertyList.ts`。
- 修改 `tests/ontology-object-attribute-panel.test.mjs`。
- 不修改接口、类型、依赖、`public/` 或 `html/`。

## 核心实现方式

复用现有可选分类请求组装逻辑：表单未选择分类时，`getDraftCategoryId` 返回 `undefined`，新增和编辑请求均不包含 `categoryId`。

## 依赖

不新增依赖。

## 验证方式

- 先增加非必填契约测试并确认旧实现失败，再删除规则使测试通过。
- 执行属性面板定向测试、格式检查、类型检查、验证构建及 `git diff --check`。
