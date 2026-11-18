# 未绑定空间的 schema 查询接口

已获用户确认。

## 需求理解

空间未绑定数据源时，使用 GET `/datasource/connection/schema/list_by_datasource`，查询参数为 `id`（数据源 ID），不传空间 ID。已绑定空间仍调用现有 schema 接口，仅传 `spaceId`。

## 修改范围与文件

修改 `src/apis/datasourceConnectionApi.ts`、`src/apis/index.ts`、`src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue`、`tests/datasource-schema-flow.test.mjs`、`docs/20261102/1.datasourceConnectionApi.md`。新增本 Plan。无删除文件，无新增依赖。

## 核心实现

新增独立按数据源 ID 查询的 API，复用 schema 响应类型。向导依据已有空间绑定状态分流，历史连接选择、新建连接后查询和失败重试使用统一分流。保留错误、重复请求、过期响应保护；不调整表、字段、绑定关系与最终构建参数。

## 验证方式

先更新绑定路径参数期望并增加未绑定路径、请求配置测试，运行确认失败后实现。执行定向测试、npm test、test:coverage、type-check、build:verify、限定文件格式与 diff 检查。浏览器工具不可用，真实后端联调及人工验收待执行，保留无关修改。

## 实施与验证记录

- 新增 `getDatasourceSchemaListByDatasourceInterface(id)` 并加入公共出口；未绑定空间仅传 `id` 调用用户指定路径，已绑定空间只传 `spaceId` 调用旧接口。表、字段和最终构建参数保持现状，无新增依赖。
- RED：更新测试后 29 项中 3 项失败；实现后定向测试 29 / 29 通过，覆盖两条分支、参数、请求路径和重试。
- 临时目录构建、限定文件格式及 `git diff --check` 通过，已核对任务 diff 和工作区状态，保留已有修改。
- 全量测试 1203 项：1166 通过、37 项既有失败，与修改前失败集合一致，无新增失败。
- 类型检查仍有其他文件的 14 项既有错误，本次修改文件无类型错误。
- 覆盖率未通过：已加载文件行 93.41%、分支 78.84%、函数 90.41%；分支低于 80%，另有上述既有测试失败。不代表全项目源码覆盖率。
- 浏览器及真实后端联调未执行，人工验收待进行，整体必需检查尚未全部通过。
