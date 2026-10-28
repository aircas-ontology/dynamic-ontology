# Plan: 下线接口改为 query string 传参

## 需求理解

`POST /ontology/function/unpublish` 的 `functionApi`、`version` 改为 query string（axios `params`），不再使用 POST body。

## 修改范围

- `src/apis/functionApi.ts` 中 `postOntologyFunctionUnpublishInterface`
- `tests/function-unpublish-api.test.mjs`

## 核心实现方式

将 `data: params` 改为 `params: params`；JSDoc 注明 query。不改发布接口与页面调用。

## 新增依赖

无。

## 验证方式

定向测试 + 任务文件 format。
