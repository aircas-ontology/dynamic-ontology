# Wire listAction for behavior table

## 需求理解

对接 docs/20261103/listActionApi.md：GET /ontology/action/list 驱动右侧行为表格。
状态 1/0 ↔ 启用/失效；分类树本轮不筛表格。

## 修改范围

- types/apis/listOntologyActionType.ts + exports
- ontologyActionApi getListOntologyActionInterface
- mock fixture + routes
- mapListOntologyActionRecord
- BehaviorListPanel 启用/失效
- useSpaceBehaviorWorkspace 列表走 API

## 新增依赖

无。

## 验证方式

单元测试、format:check、check:types-conventions、build:verify
