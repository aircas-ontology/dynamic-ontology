# List action category tree filter

## 需求理解

点击行为分类树目录（或行为叶子对应的父分类）时，携带可选 `categoryId` 重新请求 `GET /ontology/action/list` 刷新右侧列表；根分类不传 `categoryId` 查全量。

## 修改范围

- `ListOntologyActionParams` 增加 `categoryId?: number`
- `useSpaceBehaviorWorkspace`：`loadSpaceBehaviorList` 传参；`selectBehaviorCategory` 重置页码并重查
- 测试断言同步

## 新增依赖

无。

## 验证方式

相关测试 + `format:check`
