# 属性值行为测试：实体列表第一步

## 需求理解

基础行为-属性值点「测试」打开弹窗，按行为列表 `ontologyUniqIdentifier` 调实体分页列表；本轮不对接测试接口。其它类型提示暂不支持。

## 已确认规则

1. 列表 `ontologyUniqIdentifier` → 请求 `ontologyUniqueIdentifier`
2. 复用 `getOntologyEntitiesInterface`
3. 仅属性值打开弹窗；单选 + 分页
4. 缺对象标识时禁止打开并提示

## 修改范围

- SpaceBehaviorItem / mapListOntologyActionRecord
- BehaviorTestDialog.vue
- index.vue
- 测试

## 新增依赖

无

## 验证方式

相关单测 + format:check
