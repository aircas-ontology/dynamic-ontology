# Plan: 函数列表【发布】对接 publish 接口

## 需求理解

按 `docs/20261012/2.functionPublishApi.md`，将函数列表「发布」接到 `POST /ontology/function/publish`。

## 修改范围

- 类型、API、工作区 `togglePublish` 发布分支、相关测试。
- 不新增 `src/mocks`、不改 mockData。

## 新增、修改和删除文件

| 操作 | 路径                                                                          |
| ---- | ----------------------------------------------------------------------------- |
| 新增 | `src/types/apis/functionPublishType.ts`                                       |
| 修改 | `src/types/index.ts`                                                          |
| 修改 | `src/apis/functionApi.ts`、`src/apis/index.ts`                                |
| 修改 | `useFunctionOperatorWorkspace.ts`（发布走真实接口；移除本文件 Mock 状态依赖） |
| 新增 | `tests/function-publish-api.test.mjs`                                         |
| 修改 | `tests/function-unpublish-api.test.mjs`（去掉「发布仍 Mock」断言）            |
| 新增 | 本 Plan                                                                       |

## 核心实现方式

1. `FunctionPublishParams`：`functionApi`、`version`；`FunctionPublishData = null`。
2. `postOntologyFunctionPublishInterface`：POST `/ontology/function/publish`。
3. `togglePublish`：非 published 时校验并调用 publish；成功提示「发布成功」并刷新列表。

## 新增依赖及必要性

无。

## 验证方式

TDD → 定向测试 → `check:types-conventions` → `type-check` / `build:verify` → format。
