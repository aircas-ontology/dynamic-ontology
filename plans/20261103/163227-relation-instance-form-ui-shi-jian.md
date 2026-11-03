# Relation instance form section

## 需求理解
关系示例改为关系实例；basic+relationInstance 展示关系单选表；数据来自关系分类树接口；本轮不接 LINK createAction。

## 修改范围
- ontologySpaceBehaviorType：relationInstance + selectedRelationId
- BehaviorFormDialog：关系选择表
- mapListOntologyActionRecord / tests

## 新增依赖
无。

## 验证方式
测试、format:check、build:verify
