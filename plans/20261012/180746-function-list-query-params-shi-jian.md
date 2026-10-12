# Plan: 函数列表查询条件对接

## 需求理解

按 `docs/20260923/7.getFunListApi-shijian.md` 新增查询参数，把函数列表页已有筛选条件接到接口；创建人不对接。

| UI 条件        | 请求参数                | 映射                                                                                                           |
| -------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| 按函数名称搜索 | `displayName`           | `filters.keyword` trim 后有值才传                                                                              |
| 函数类型       | `type`                  | `basic→BASIC_QUERY`，`code→CUSTOMIZE`，`api→EXTERNAL`，`composite→COMPOSITE`；`docker` 无契约对应，不传 `type` |
| 状态           | `publishStatus`         | `draft→0`，`published→1`；`testing`/`disabled`/空不传                                                          |
| 日期范围       | `startDate` / `endDate` | `updatedRange` 的 `YYYY-MM-DD`                                                                                 |
| 创建人         | —                       | UI 保留，不传参；去掉其客户端过滤                                                                              |

接线后去掉名称/类型/状态/日期的客户端过滤；分页仍用接口 `total`。本地排序保持现有客户端排序。

## 修改范围

- `src/types/apis/getOntologyFunctionListType.ts`
- `src/apis/functionApi.ts`（JSDoc）
- `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts`
- `tests/get-ontology-function-list-api.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件
- 新增 / 删除：无

## 核心实现方式

1. 扩展 `GetOntologyFunctionListParams`：可选 `displayName`、`type`、`publishStatus`、`startDate`、`endDate`。
2. workspace 内映射函数组装请求参数；空值不传。
3. `loadOperators` 传参；删除客户端 filter。
4. 更新测试断言。

## 新增依赖及必要性

无。

## 验证方式

- TDD + `node --test tests/get-ontology-function-list-api.test.mjs`
- `npm run format -- <任务文件>` + `format:check`
