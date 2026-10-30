# 函数编排列表测试对齐脚本函数

## 需求理解

函数列表与详情抽屉中的「测试」对函数编排（composite / COMPOSITE）改走脚本函数测试弹框与同一套执行接口，标题为「函数编排测试」。

## 修改范围

- `isScriptFunctionOperator` 增加 composite / COMPOSITE
- 弹框标题增加「函数编排测试」
- 更新 `tests/test-ontology-function-api.test.mjs`

## 新增、修改和删除文件

- 修改 `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts`
- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorScriptTestDialog.vue`
- 修改 `tests/test-ontology-function-api.test.mjs`

不新增、不删除文件。

## 核心实现方式

列表测试入口只扩展类型判断，复用 `openScriptTest` / `runScriptTest`。

## 新增依赖及必要性

无。

## 验证方式

先更新断言再实现；跑相关测试、`format:check`、`type-check`、`build:verify`。
