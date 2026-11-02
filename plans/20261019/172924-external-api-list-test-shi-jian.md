# 外部 API 函数列表测试对齐脚本函数

## 需求理解

函数列表和详情抽屉中的「测试」对外部 API 函数改走脚本函数测试弹框与请求，不再走基础函数的对象选择和属性绑定。新建弹框中的配置测试仍不调用测试接口。

## 修改范围

`isScriptFunctionOperator` 增加 `type === "api"` 与 `apiModelType === "EXTERNAL"`，复用 `openScriptTest` 与 `runScriptTest`。弹框在外部 API 时标题为「外部 API 函数测试」，脚本函数标题不变。入参仍取详情 `params` 中 `category` 为 `INPUT` 的树。

## 新增、修改和删除文件

- 修改 `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts`
- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorScriptTestDialog.vue`
- 修改 `src/views/FunctionOperatorPanel/index.vue`
- 修改 `tests/test-ontology-function-api.test.mjs`

不新增、不删除文件。

## 核心实现方式

列表测试入口只扩展类型判断，请求体继续由 `buildOntologyFunctionScriptTestRequest` 组装为 `functionApi`、`version`、`parameters`。

## 新增依赖及必要性

无。

## 验证方式

先更新断言并确认失败，再实现。执行该测试文件、`npm run type-check`、`npm run build:verify`，以及对本次文件的 `npm run format:check`。
