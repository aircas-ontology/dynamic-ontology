# 函数编排列表改为 excludeTypes=BASIC_QUERY

## 需求理解

新建或编辑函数编排工作流时，`GET /ontology/function/list` 参数由 `type=COMPOSITE`（及侧栏 `type=CUSTOMIZE`）改为 `excludeTypes=BASIC_QUERY`。

## 修改范围

- 列表请求类型增加 `excludeTypes`
- FormDialog 编排源函数列表、CompositeWorkflowDialog 侧栏列表改用该参数
- 更新相关测试

## 新增、修改和删除文件

**修改**

- `src/types/apis/getOntologyFunctionListType.ts`
- `src/apis/functionApi.ts`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeWorkflowDialog.vue`
- `tests/get-ontology-function-list-api.test.mjs`
- `tests/function-operator-workspace.test.mjs`

## 核心实现方式

编排场景传 `excludeTypes: "BASIC_QUERY"` 且不传 `type`；其它类型源函数列表仍用 `type`。

## 新增依赖

无。

## 验证方式

- 相关 `node --test`
- `npm run format:check -- <本任务文件>`
- `npm run check:types-conventions`、`npm run build:verify`
