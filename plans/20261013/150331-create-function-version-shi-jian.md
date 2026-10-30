# 新建函数补充 version 参数

## 需求理解

POST /ontology/function 必填 version；当前类型与新建 payload 未传。

## 修改范围

创建类型、新建保存传参、API JSDoc、契约测试。

## 新增、修改和删除文件

- 修改：createOntologyFunctionType.ts、functionApi.ts、useFunctionOperatorWorkspace.ts、tests/create-ontology-function-api.test.mjs

## 核心实现方式

CreateOntologyFunctionParams 增加 version；saveOperator 共享 payload 含 version，空则中止。

## 新增依赖及必要性

无。

## 验证方式

TDD；create/update 相关测试；format:check；check:types-conventions。
