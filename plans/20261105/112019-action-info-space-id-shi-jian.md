# 行为详情查询增加 ontologySpaceId

## 需求理解

`GET /ontology/action` 增加必填查询参数 `ontologySpaceId`。

## 修改范围

- `GetOntologyActionInfoParams`
- `getOntologyActionInfoInterface` JSDoc
- `BehaviorFormDialog` 调用处传 `props.spaceId`
- 相关测试断言

## 新增依赖

无

## 验证方式

相关单测 + format:check
