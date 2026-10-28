# 外部 API 函数编辑回显

## 需求理解

编辑外部 API 函数时，沿用已有的 `GET /ontology/function/detail`。详情 `data.apiConfig` 与新建保存同结构时，回填接口地址、请求方法、认证方式、认证 Header、输入参数和输出参数。`authType` 为 `apiKey` 时回填 Header；为 `none` 时 Header 为空。无法识别的参数类型或位置跳过该行。没有 `apiConfig` 时外部配置保持空白，通用配置仍用现有详情字段。

## 修改范围

- 详情数据类型增加可选 `apiConfig`。
- 详情转草稿时，外部 API 携带这份配置。
- 编辑弹框打开后把配置写入外部 API 表单。
- 不改新建、配置测试和详情 Mock。

## 新增、修改和删除文件

- 修改 `src/types/apis/getOntologyFunctionDetailType.ts`
- 修改 `src/types/pages/ontologyFunctionOperatorType.ts`
- 修改 `src/utils/mapOntologyFunctionDetail.ts`
- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- 修改 `tests/get-ontology-function-detail-api.test.mjs`
- 不新增、不删除文件

## 核心实现方式

纯函数把 `apiConfig` 转成表单值：位置 `body/path/query/header` 对应 `Body/Path/Query/Header`，类型仅接受 `string/number/boolean/array/object`。弹框在草稿为外部 API 时应用该结果，不改动配置测试 JSON。

## 新增依赖及必要性

无。

## 验证方式

先写失败测试，再实现。执行 `tests/get-ontology-function-detail-api.test.mjs`，以及任务文件的 `format:check`、`type-check`、`build:verify`。登录页会挡住编辑弹框。
