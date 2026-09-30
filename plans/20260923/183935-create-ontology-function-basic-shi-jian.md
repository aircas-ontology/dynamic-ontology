# Plan：新建基础函数算子（对接 createFunApi）

## 需求理解

按 `docs/20260923/6.createFunApi-shijian.md` 与 `docs/20260923/shijian.md` 28–56 实现新建基础函数（`type: BASIC_QUERY`）。

- `queryConfig.filters` 由参数配置表单构建，字段使用 `dataType`（STRING/NUMBER/BOOLEAN）。
- 可选聚合类型 `aggFunc`：SUM/COUNT/AVG/MAX/MIN/DISTINCT；未选不传。
- 嵌套 GROUP、BETWEEN、IS_NULL 等表单能力提交时原样映射。
- 编辑暂不接后端（接口未开发），仍用本地 Mock。

## 用户确认的契约点

1. 响应无业务 `data`：Mock/类型按 `null` 处理。
2. `boolean` → `BOOLEAN`。
3. 接受嵌套 GROUP / BETWEEN / IS_NULL。
4. 编辑不接创建接口。

## 修改范围

纳入：API / Types / Mock、filters 映射工具、表单 aggFunc、新建保存接线、相关单测。  
不纳入：编辑/删除/列表后端化、非 basic 类型。

## 新增、修改和删除文件

| 动作 | 路径 |
|------|------|
| 新增 | `src/types/apis/createOntologyFunctionType.ts` |
| 新增 | `src/apis/functionApi.ts` |
| 新增 | `src/mocks/createOntologyFunctionMock/createOntologyFunctionMock.ts` |
| 新增 | `tests/create-ontology-function-api.test.mjs` |
| 修改 | `src/types/index.ts`、`src/apis/index.ts` |
| 修改 | `src/types/pages/ontologyFunctionOperatorType.ts` |
| 修改 | `src/utils/functionOperatorBasicFilter.ts`（或邻近映射函数） |
| 修改 | `FunctionOperatorFormDialog.vue` |
| 修改 | `useFunctionOperatorWorkspace.ts` |
| 修改 | `tests/function-operator-workspace.test.mjs` |

## 核心实现方式

- POST `ONTOLOGYMANAGE_URL + "/ontology/function"`，`createOntologyFunctionInterface`。
- 请求：`functionApi`、`displayName`、`description`、`type: BASIC_QUERY`、`ontologySpaceId`、可选 `queryConfig`。
- 表单 `parameterConfig` → `queryConfig.filters`（`valueType` → `dataType` 大写）；有 aggFunc 才写入。
- 新建：调 API，`code === 200` 成功后刷新；编辑：仍 `updateFunctionOperatorMock`。

## 新增依赖及必要性

无。

## 验证方式

TDD → 相关 `npm test` → `format:check` → `type-check` / `build:verify`。
