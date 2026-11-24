# Plan：保存函数 parameters 带上 description

## 需求理解

创建/修改脚本函数时，`parameters[]` 每项需带 `description`（可为空串），与 create/put 文档一致。

## 修改范围

- 类型 `CreateOntologyFunctionParameter` 增加 `description`
- `mapParsedParameters` 映射写入（缺省 `""`）
- 更新组装单测

## 新增、修改和删除文件

- 修改：`src/types/apis/createOntologyFunctionType.ts`
- 修改：`src/views/FunctionOperatorPanel/utils/buildCreateOntologyScriptFunctionParams.ts`
- 修改：`tests/build-create-ontology-script-function-params.test.mjs`

## 核心实现方式

在 `mapParsedParameters` 中为每个参数写入 `description: item.description?.trim() ? item.description : ""`（或等价的空串兜底）。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/build-create-ontology-script-function-params.test.mjs`
- `format:check` 任务文件
