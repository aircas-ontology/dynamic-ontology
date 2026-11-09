# 接通应用行为测试提交

## 需求理解

从表单组装 POST /ontology/action/test 请求并提交，展示返回结果。

## 修改范围

- testOntologyActionType.ts
- buildApplicationTestRequestParams.ts（新增）
- BehaviorTestDialog.vue
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 新增组装工具；修改类型、弹框与测试

## 核心实现方式

EXTERNAL→params；PROPERTY→entityPrimaryKeys（有顶层对象可用 entityPrimaryKey）；有关系时对端→linkEntityPrimaryKey；启用开始测试并展示 data。

## 新增依赖

无

## 验证方式

组装单测、format、行为测试、build:verify
