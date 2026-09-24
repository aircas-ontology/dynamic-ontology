# Plan：对接函数算子删除 API

确认范围（用户 2026-09-24「确认」）。

## 需求理解

按 `docs/20260924/deleteFunApi-shijian.md` 实现删除接口，并接到卡片 / 表格 / 详情抽屉共用的 `removeOperator`。

## 契约冲突处理（已确认）

1. `functionApi` 走 path，不传 body。
2. Mock `message` 用输出样例 `SUCCESS`。
3. Mock 补 `success: true`、`data: null`。

## 修改范围

| 操作 | 路径                                                                 |
| ---- | -------------------------------------------------------------------- |
| 新增 | `src/types/apis/deleteOntologyFunctionType.ts`                       |
| 修改 | `src/types/index.ts`                                                 |
| 修改 | `src/apis/functionApi.ts`、`src/apis/index.ts`                       |
| 新增 | `src/mocks/deleteOntologyFunctionMock/deleteOntologyFunctionMock.ts` |
| 修改 | `useFunctionOperatorWorkspace.ts`                                    |
| 新增 | `tests/delete-ontology-function-api.test.mjs`                        |

## 核心实现

- `DELETE` `/ontology/function/delete/{functionApi}`
- `removeOperator` 用 `operator.functionApi` 调接口，成功后关详情并 `loadOperators`

## 新增依赖

无。

## 验证方式

相关单测、`format:check`、`check:types-conventions`、`type-check`、`build:verify`、`npm test` / `test:coverage`
