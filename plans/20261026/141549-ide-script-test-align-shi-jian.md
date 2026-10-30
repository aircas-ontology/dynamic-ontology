# IDE 内测试对齐列表脚本测试

## 需求理解

IDE 右侧测试区改为与列表「脚本函数测试」相同的入参树；保存（解析成功）后按 INPUT 刷新测试参数；「测试」按 functionApi/version/parameters 调用同一测试接口。

## 修改范围

- src/utils/mapOntologyFunctionTest.ts
- FunctionOperatorScriptIdeDialog.vue
- useFunctionOperatorWorkspace.ts
- FunctionOperatorFormDialog.vue
- scriptFunctionStarters.ts（按需）
- tests

## 核心实现方式

1. buildOntologyFunctionScriptTestInputRowsFromParsed + writeOntologyFunctionScriptTestParamValue
2. IDE 用 ParamTree；保存解析成功后刷新；测试对齐 runScriptTest
3. 移除 FormDialog testParams JSON 草稿

## 新增依赖

无

## 验证方式

相关测试、format:check、type-check、build:verify
