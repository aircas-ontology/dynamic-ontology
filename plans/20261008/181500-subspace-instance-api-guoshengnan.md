# 子空间实例接口接入实施方案

## 需求理解
选择子空间对象后，点击下一步按选中对象逐个查询实体实例接口，替换本地固定样例数据，并支持异步状态和分页。

## 修改范围
- 新增实体实例查询 API 类型和接口封装。
- 修改子空间创建页面的下一步流程、实例加载状态与分页请求。
- 修改实例面板，使对象分组分页由接口数据驱动。
- 保留现有树样式、对象选择、实例勾选和后续步骤数据流。

## 文件
- 新增：src/types/apis/getOntologyEntitiesType.ts
- 新增：src/apis/ontologyEntityApi.ts
- 修改：src/types/index.ts、src/apis/index.ts
- 修改：src/views/OntologySubspaceCreate/index.vue
- 修改：src/views/OntologySubspaceCreate/components/SubspaceCreateInstancePanel.vue
- 修改：src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue（仅传递实例状态与事件）
- 修改：src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedInstance.ts
- 按现有测试入口补充必要的接口和流程测试。

## 核心实现方式
页面按对象唯一标识调用 `GET /ontology/entity/list`，维护请求代次避免过期响应覆盖；每个对象维护独立的页码、页大小、总数和加载状态，翻页或调整页大小时只重新请求对应对象。实体主属性记录映射为实例名称和唯一 id，勾选状态跨页保留。

## 新增依赖
无。

## 验证方式
执行格式检查、`npm test`、`npm run test:coverage`、`npm run check:types-conventions`、`npm run type-check`、`npm run build:verify` 和 `git diff --check`。
