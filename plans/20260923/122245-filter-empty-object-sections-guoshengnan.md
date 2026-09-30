# 过滤对象列表中的空分类分组

## 需求理解

对象管理页面右侧对象列表不展示本体数量为 0 的分类分组；左侧分类树仍保留完整分类层级。

## 修改范围

- 调整分类树数据到右侧对象列表分组的映射逻辑，仅保留包含本体对象的分类。
- 更新分类映射测试，覆盖空分类被过滤且有对象分类继续展示。

## 文件变更

- 修改 `src/views/OntologySpaceManagementDetail/utils/mapOntologyCategoryTree.ts`。
- 修改 `tests/ontology-category-tree-api.test.mjs`。

不新增依赖，不修改接口、类型、路由或受保护目录。

## 核心实现方式

在 `mapOntologyCategorySections` 递归访问分类节点时，仅当 `items.length > 0` 且不是合成“全部”根节点时写入 sections；树节点映射保持现有 count 和 children 数据不变。

## 验证方式

- 先运行更新后的映射测试确认当前实现失败，再完成最小修改并运行分类、对象工作区定向测试。
- 对本次修改文件执行格式检查，并运行类型约定检查、类型检查、验证构建和 `git diff --check`。
