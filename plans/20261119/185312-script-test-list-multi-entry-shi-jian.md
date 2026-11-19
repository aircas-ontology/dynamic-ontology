# 脚本函数 LIST 测试支持多组入参

## 需求理解

脚本函数测试（IDE 右侧测试参数、脚本测试弹框、编排测试共用参数树）在参数类型为 `LIST`/`ARRAY` 且有元素字段时，支持添加/删除多组元素输入，并按后端约定提交。顶层标量也改为带 `paramType` 与类型化 `paramValue` 的格式，例如：

```json
{
  "paramName": "orders",
  "paramType": "LIST",
  "paramValue": [{ "id": "o1", "customerName": "客户A", "amount": 35.5 }]
}
```

无元素字段的 LIST 保持单值输入。基础函数（BASIC_QUERY）测试不改。

## 修改范围

测试入参模型、生成、回写、请求序列化、测试参数树 UI 及其调用方接线。

## 新增、修改和删除文件

- 修改 `src/utils/mapOntologyFunctionTest.ts`
- 修改 `src/types/apis/testOntologyFunctionType.ts`
- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorScriptTestParamTree.vue`
- 按需修改 IDE / workspace / 编排对话框对树事件的接线
- 修改 `tests/test-ontology-function-api.test.mjs`

## 核心实现方式

1. `OntologyFunctionScriptTestInputRow` 增加 `listItems`；`LIST`/`ARRAY` 且有 `fields` 时，以字段树为元素模板，初始 1 组空元素。
2. UI 对 LIST 展示多组输入与添加/删除。
3. 序列化：LIST → `{ paramName, paramType, paramValue: object[] }`；顶层标量 → `{ paramName, paramType, paramValue }`（按类型转换）；OBJECT 仍可用嵌套对象或兼容路径，与 LIST/标量新格式并存时优先对齐为带 `paramType` 的结构。
4. 不新增依赖。

## 新增依赖及必要性

无。

## 验证方式

- TDD：先补 LIST 多组与类型化请求组装测试并确认失败，再实现后通过。
- `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`
- 对本次修改且受 Prettier 支持的文件执行 `format` / `format:check`
