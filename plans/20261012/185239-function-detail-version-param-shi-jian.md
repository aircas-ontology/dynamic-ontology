# Plan: 函数详情接口必传 version

## 需求理解

按 `docs/20260924/getFunInfoApi-shijian.md`，详情接口新增必填查询参数 `version`。现有调用只传 `functionApi`。

## 修改范围

- `src/types/apis/getOntologyFunctionDetailType.ts`
- `src/apis/functionApi.ts`（JSDoc）
- `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts`（`openDetail` / `openEdit` / `openTest`）
- `tests/get-ontology-function-detail-api.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件
- 新增 / 删除：无

## 核心实现方式

1. `GetOntologyFunctionDetailParams` 增加必填 `version: string`。
2. 三处调用改为 `{ functionApi, version }`，`version` 取自 `operator.version.trim()`；缺失时提示并中止。
3. 更新测试断言。

## 新增依赖及必要性

无。

## 验证方式

- TDD + `node --test tests/get-ontology-function-detail-api.test.mjs`
- format:check 任务文件
