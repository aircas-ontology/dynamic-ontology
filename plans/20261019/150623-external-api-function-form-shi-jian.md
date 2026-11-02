# 新建外部 API 函数表单

## 需求理解

选择「外部 API 函数」后，新建弹框展示三段：基于已有函数、通用配置、外部 API 函数配置。保存仍不可用，不接创建接口。容器算子函数保持未开放。

## 修改范围

函数类型说明、EXTERNAL 与页面类型 `api` 的映射、新建表单展示与本地字段。

## 新增、修改和删除文件

- 修改 `src/types/pages/ontologyFunctionOperatorType.ts`
- 修改 `src/utils/mapFunctionOperatorTypeToApi.ts`
- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- 修改 `tests/function-operator-workspace.test.mjs`

## 核心实现方式

- 类型说明改为「调用外部 HTTP 接口」。
- `api` 映射为 `EXTERNAL`，列表反向映射为 `api`，供源函数下拉使用。
- 外部配置字段留在表单本地状态：接口地址、请求方法（GET/POST/PUT/DELETE，默认 POST）、认证方式固定「无认证」、认证 Header 只读。
- 名称、API 名称、版本号、调用协议、函数说明沿用脚本函数校验。保存按钮在非基础函数时保持禁用。

## 新增依赖及必要性

无。

## 验证方式

- 先补表单与类型映射断言并确认失败，再实现后运行 `node --test --experimental-strip-types tests/function-operator-workspace.test.mjs`。
- `npm run type-check`、`npm run build:verify`。
- `npm test` 记录既有失败。
- 对本次文件执行 `format` 与 `format:check`。
