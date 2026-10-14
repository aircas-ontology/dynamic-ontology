# 子空间创建关系接口接入方案

## 需求理解

配置属性步骤点击下一步时查询父空间关系列表，并依据子空间第一步选中的对象筛选关系；仅保留来源对象和目标对象都被选中的关系。关系为空时仍进入关系选择步骤，查询失败时停留当前步骤并支持重试。

## 修改范围

- 修改 `src/views/OntologySubspaceCreate/index.vue`，增加父空间关系查询、筛选、异步状态和步骤流转。
- 修改 `src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue`，展示关系查询状态和重试入口。
- 修改 `src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedRelation.ts`，增加关系树到子空间关系行的映射和对象筛选。
- 更新 `tests/ontology-subspace-create.test.mjs`，覆盖关系筛选、空数据和页面接口契约。

## 核心实现方式

复用 `getOntologyRelationCategoryTreeInterface`，使用路由中的父空间 `spaceId` 查询关系分类树，递归收集 links，并通过关系两端对象唯一标识与已选对象集合求交集。使用请求代次避免过期响应覆盖当前状态。

## 新增依赖

无。

## 验证方式

执行子空间定向测试、格式检查、类型目录检查、类型检查、构建验证和 `git diff --check`。
