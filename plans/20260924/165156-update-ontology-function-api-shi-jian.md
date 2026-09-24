# Plan：编辑保存对接 putFunApi

确认范围（用户 2026-09-24「确认」）。

## 需求理解

编辑函数算子点「保存」时，调用 `docs/20260924/putFunApi-shijian.md` 的 PUT `/ontology/function`；请求体与创建接口同形。替换 `saveOperator` 编辑分支的 `updateFunctionOperatorMock`。

## 契约冲突处理（已确认）

1. Mock `message` 用输出样例 `SUCCESS`。
2. Mock 补 `success: true`、`data: null`。

## 修改范围

| 操作 | 路径                                                                 |
| ---- | -------------------------------------------------------------------- |
| 新增 | `src/types/apis/updateOntologyFunctionType.ts`                       |
| 修改 | `src/types/index.ts`                                                 |
| 修改 | `src/apis/functionApi.ts`、`src/apis/index.ts`                       |
| 新增 | `src/mocks/updateOntologyFunctionMock/updateOntologyFunctionMock.ts` |
| 修改 | `useFunctionOperatorWorkspace.ts`                                    |
| 新增 | `tests/update-ontology-function-api.test.mjs`                        |
| 修改 | `tests/create-ontology-function-api.test.mjs`                        |

## 核心实现

- `updateOntologyFunctionInterface`：PUT + `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL` + `/ontology/function`
- Params 与 create 对齐；`queryConfig` 复用 `CreateOntologyFunctionQueryConfig`
- `saveOperator` 有 `draft.id` 时走更新接口并刷新列表

## 新增依赖

无。

## 验证方式

相关单测、`format:check`、`check:types-conventions`、`type-check`、`build:verify`、`npm test` / `test:coverage`
