# 源版本下拉接入版本列表接口

## 需求理解

新建函数算子时，选中「源函数」后，「源版本」下拉调用 GET `/ontology/function/versions`（query：`functionApi`），用响应 `data: string[]` 渲染选项。本次只做下拉选项渲染，不根据所选版本回填表单模板字段。

## 修改范围

- API / types / mocks / mockData
- 表单弹窗源版本加载逻辑与契约测试
- 不改保存、发布、详情回填；不改 `public/`

## 新增、修改和删除文件

- 新增：`src/types/apis/getOntologyFunctionVersionsType.ts`
- 新增：`src/mocks/getOntologyFunctionVersionsMock/getOntologyFunctionVersionsMock.ts`
- 新增：`src/mockData/fixtures/ontology/function/versions.get.json`
- 新增：`tests/get-ontology-function-versions-api.test.mjs`
- 修改：`src/types/index.ts`、`src/apis/functionApi.ts`、`src/apis/index.ts`、`src/mockData/routes.json`、`FunctionOperatorFormDialog.vue`、`tests/function-operator-workspace.test.mjs`

## 核心实现方式

选择源函数后清空已选版本并请求版本列表（generation 防过期）；清空源函数或关闭弹窗时清空选项。失败提示错误并清空选项。

## 新增依赖及必要性

无。

## 验证方式

- TDD：先写 versions API 与表单源码契约测试至 RED，再实现 GREEN
- `node --test --experimental-strip-types tests/get-ontology-function-versions-api.test.mjs tests/function-operator-workspace.test.mjs tests/mock-http-server.test.mjs`
- `npm run check:types-conventions`
- `npm run format:check --` 任务文件
