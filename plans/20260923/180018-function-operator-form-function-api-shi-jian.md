# Plan：新建函数算子增加「函数 api 名称」

## 需求理解

在「新建/编辑函数算子」对话框的通用配置中，与现有「函数名称」同排增加必填项「函数 api 名称」，两者各占约 50% 宽度。字段与 `docs/20260923/6.createFunApi-shijian.md` 中的 `functionApi` 对齐。

## 修改范围

- 纳入：页面类型、表单 UI/校验、Mock 种子与创建回填、相关单测
- 不纳入：`POST /ontology/function` 正式 API 实现；列表/详情展示优化（除非保存链路必须带上该字段）

## 新增、修改和删除文件

| 动作 | 路径 |
|------|------|
| 修改 | `src/types/pages/ontologyFunctionOperatorType.ts` |
| 修改 | `src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorFormDialog.vue` |
| 修改 | `src/mocks/functionOperatorMock/functionOperatorMock.ts` |
| 修改 | `tests/function-operator-workspace.test.mjs` |

## 核心实现方式

1. `FunctionOperator` / Draft 增加 `functionApi: string`（展示名仍用现有 `name`）。
2. 表单用两列 grid：左「函数名称」、右「函数 api 名称」；必填；编辑时 `functionApi` 禁用。
3. 提交时 `trim()`；Mock create/update/seed 写入该字段。

## 新增依赖及必要性

无。

## 验证方式

TDD：先补失败断言 → 实现 → `npm test`（相关用例）→ 任务文件 `format:check` → `type-check` / `build:verify`。
