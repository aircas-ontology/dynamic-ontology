# 未绑定空间按数据源查询表

已获用户确认。

## 需求与范围

数据源构建对象时，空间未绑定数据源则调用 GET `/ontology/datasource/connection/table/list_by_datasource`，传 `id`（所选数据源 ID）与 `schemaName`。已绑定空间继续使用现有表查询接口和原参数处理。字段查询、主子表配置和最终构建格式保持现状。

## 文件

修改 `src/apis/datasourceConnectionApi.ts`、`src/apis/index.ts`、`src/types/apis/datasourceConnectionType.ts`、`src/types/index.ts`、`src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue`、`tests/datasource-schema-flow.test.mjs`、`docs/20261102/1.datasourceConnectionApi.md`。新增本 Plan，无删除文件、无新增依赖。

## 实现

新增独立请求类型和 API，经公共出口导出。向导选表查询仅在未绑定空间分流，复用现有表摘要响应、加载、错误、空态和过期响应保护，校验有效数据源 ID。

## 验证

先补未绑定接口路径与参数、已绑定原路径和错误重试等测试并确认失败，再实现。执行定向测试、npm test、test:coverage，并依次执行 check:types-conventions、type-check、build:verify，另检查限定文件格式和 diff。浏览器工具不可用，真实接口与人工验收待执行。保留已有修改。

## 实施与验证记录

- 已新增独立 API 及参数类型和公共出口。仅未绑定空间选表调用新接口，传 `id` 和 `schemaName`；已绑定分支保留原 API 和原参数组装，字段及构建数据未修改。
- RED：新增路径与未绑定分支测试失败；实现后定向测试 36 / 36 通过，覆盖已绑定兼容、参数校验、错误重试、防重复与过期响应。
- 类型规范、临时目录构建、限定文件格式及 `git diff --check` 通过，已核对任务 diff 和工作区状态。
- 全量测试 1212 项：1172 通过、40 项既有失败，与同步后基线失败集合一致，无新增失败。
- 类型检查仍有其他文件的 15 项既有错误，本次修改文件无类型错误。
- 已加载文件覆盖率：行 93.44%、分支 78.76%、函数 90.51%，分支未达到 80% 且有上述既有测试失败，检查未通过；不代表全项目源码覆盖率。
- 真实后端、浏览器和人工验收未执行，整体必需检查尚未全部通过。
