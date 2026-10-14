# Plan: 函数列表【下线】对接 unpublish 接口

## 需求理解

按 `docs/20261012/1.functionUnpublishApi.md`，将函数列表卡片/表格「下线」接到 `POST /ontology/function/unpublish`。【发布】仍走现有 Mock。

## 修改范围

- 类型、API、工作区 `togglePublish` 的下线分支、相关测试。
- 不新增 `src/mocks`、不改 mockData、不做发布真实接口。

## 新增、修改和删除文件

| 操作 | 路径                                                                          |
| ---- | ----------------------------------------------------------------------------- |
| 新增 | `src/types/apis/functionUnpublishType.ts`                                     |
| 修改 | `src/types/index.ts`                                                          |
| 修改 | `src/apis/functionApi.ts`                                                     |
| 修改 | `src/apis/index.ts`                                                           |
| 修改 | `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts` |
| 新增 | `tests/function-unpublish-api.test.mjs`                                       |
| 新增 | 本 Plan                                                                       |

## 核心实现方式

1. `FunctionUnpublishParams`：`functionApi`、`version`；`FunctionUnpublishData = null`。
2. `postOntologyFunctionUnpublishInterface`：`functionApi.ts`，POST body，URI `/ontology/function/unpublish`。
3. `togglePublish`：`status === "published"` 时校验 `version`，调真实接口；成功提示「下线成功」并刷新列表；否则仍用 `setFunctionOperatorStatusMock` 发布。

## 新增依赖及必要性

无。

## 验证方式

1. TDD：先写失败测试再实现。
2. 定向测试、`check:types-conventions`、`type-check`、`build:verify`、任务文件 format。
