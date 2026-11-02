# 编辑保存补充 version 参数

## 需求理解

PUT /ontology/function 必填 version；当前类型与 saveOperator 未传。

## 修改范围

更新类型、编辑保存传参、契约测试；不改创建 POST、不改表单 UI。

## 新增、修改和删除文件

- 修改：updateOntologyFunctionType.ts、useFunctionOperatorWorkspace.ts、tests/update-ontology-function-api.test.mjs

## 核心实现方式

UpdateOntologyFunctionParams 增加 version；saveOperator 更新分支传 draft.version.trim()，空则中止并提示。

## 新增依赖及必要性

无。

## 验证方式

TDD；node --test tests/update-ontology-function-api.test.mjs；format:check。
