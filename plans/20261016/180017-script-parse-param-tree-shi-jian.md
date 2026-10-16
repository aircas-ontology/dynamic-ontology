# 脚本 IDE 用解析接口结果展示入出参层级

## 需求理解

脚本 IDE 左侧输入、输出参数改为展示 `POST /ontology/function/parse_params` 的返回结果，不再在打开或编辑代码时用前端解析结果刷新列表。对象参数带非空 `fields` 时按多级嵌套展示。解析前、解析失败、代码相对上次成功解析发生变化后，列表为空。保存创建请求仍使用现有前端解析组装扁平 `parameters`，不改创建接口契约。

## 修改范围

- 解析响应类型增加可选递归 `fields`。
- Mock 与 fixture 改为文档中的嵌套样例（`input` / `age` / `Output`）。
- 脚本 IDE 左侧用递归列表渲染；解析成功且 `parsed === true` 时写入列表。
- 不新增依赖，不修改 `public/`、`html/`。

## 新增、修改和删除文件

- 修改：`src/types/apis/parseOntologyFunctionParamsType.ts`
- 修改：`src/mocks/parseOntologyFunctionParamsMock/parseOntologyFunctionParamsMock.ts`
- 修改：`src/mockData/fixtures/ontology/function/parse_params.post.json`
- 新增：`src/views/FunctionOperatorPanel/utils/splitParsedScriptParameters.ts`
- 新增：`src/views/FunctionOperatorPanel/components/FunctionOperatorScriptParamTree.vue`
- 修改：`src/views/FunctionOperatorPanel/components/FunctionOperatorScriptIdeDialog.vue`
- 修改：`tests/parse-ontology-function-params-api.test.mjs`
- 修改：`tests/function-operator-workspace.test.mjs`
- 新增：`tests/split-parsed-script-parameters.test.mjs`

## 核心实现方式

- `fields?: ParseOntologyFunctionParamItem[]`。
- `splitParsedScriptParameters` 只按顶层 `category` 分为 INPUT / OUTPUT，每一层按 `paramOrder` 升序，并递归排序子级。
- 树节点展示 `paramName` 与 `paramType`；有下级时缩进嵌套列表。
- 保存路径在提交时调用 `parseScriptExportParams`，不依赖左侧展示数据。

## 新增依赖及必要性

无。

## 验证方式

- TDD：先让拆分、契约和 IDE 展示相关测试失败，再实现并通过。
- `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`、`npm run check:types-conventions`。
- 对本次改动的 Prettier 文件执行 `format:check`。
- 浏览器打开脚本 IDE，确认解析前为空、解析后可见多级嵌套、修改代码后列表清空。
