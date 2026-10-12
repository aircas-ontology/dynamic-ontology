# Plan: 发布接口改为 query string，并更新两份 Api.md

## 需求理解

发布接口 `functionApi`、`version` 改为 query string；在 `1.functionUnpublishApi.md` 与 `2.functionPublishApi.md` 中注明传参方式。

## 修改范围

- `src/apis/functionApi.ts`（publish）
- `tests/function-publish-api.test.mjs`
- 上述两份 docs Api.md

## 核心实现方式

`postOntologyFunctionPublishInterface` 使用 axios `params`；文档「输入参数」节注明 query string。

## 新增依赖

无。

## 验证方式

定向测试 + 任务文件 format。
