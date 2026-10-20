# 外部 API 认证 Header key / 值拆分

## 需求理解

依据 docs/20261019/shijian.md 第 17 行：`apiConfig` 增加 `apiKeyHeader`。

认证方式为 API Key 时：

- 新增表单项「认证 Header key」→ 请求字段 `apiKeyHeader`
- 原「认证 Header」改名为「认证 Header 值」→ 仍对应 `apiKey`

新建与编辑共用同一表单，详情回填与保存组装一并支持；`authType !== apiKey` 时不提交这两个字段。

## 修改范围

- `src/types/apis/createOntologyFunctionType.ts`
- `src/views/FunctionOperatorPanel/utils/buildCreateOntologyExternalFunctionParams.ts`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- `src/utils/mapOntologyFunctionDetail.ts`
- `src/apis/functionApi.ts`（JSDoc）
- 相关 tests

## 新增、修改和删除文件

### 修改

- 上述类型、组装、表单、详情映射、API JSDoc 与测试文件

### 新增 / 删除

- 无源码新增或删除（仅 Plan 历史文件）

## 核心实现方式

`authType=apiKey` 时表单展示 key + 值两项并校验必填，组装写入 `apiKeyHeader` / `apiKey`；`none` 时不写入。

## 新增依赖及必要性

无。

## 验证方式

TDD 后执行相关 test、`type-check`、`build:verify`、任务范围 `format:check`。
