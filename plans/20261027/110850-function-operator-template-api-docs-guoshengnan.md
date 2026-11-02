# 函数算子代码模板接口说明文档

## 需求理解

根据内网 Knife4j OpenAPI 定义，为函数算子代码模板的查询、创建、修改、删除接口生成项目现有格式的 Markdown 接口说明。

## 修改范围

- 新增 `docs/20261027/1.listFunctionOperatorTemplateApi.md`
- 新增 `docs/20261027/2.createFunctionOperatorTemplateApi.md`
- 新增 `docs/20261027/3.updateFunctionOperatorTemplateApi.md`
- 新增 `docs/20261027/4.deleteFunctionOperatorTemplateApi.md`

## 核心实现方式

按现有接口文档模板记录接口来源、操作标识、请求方法、路径、参数、请求体、响应模型、字段约束、示例及前端编译位置。字段依据 `FunctionOperatorTemplateParam` 和 `FunctionOperatorTemplate` OpenAPI 模型整理。

## 新增依赖

无。

## 验证方式

执行 Markdown 格式检查、Git diff 检查和项目状态检查；本次仅新增文档，不执行应用类型检查、构建或行为测试。
