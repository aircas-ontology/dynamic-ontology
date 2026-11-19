# 未绑定空间按数据源查询字段

已获用户确认。

## 需求与范围

空间未绑定数据源时，构建对象的字段步骤使用 GET `/ontology/datasource/connection/table/columns_by_datasource`，传 `id`、`schemaName` 和逗号分隔的 `tableNames`。已绑定空间继续使用原字段接口与参数处理，不修改字段映射、主键、外键配置及最终构建数据。

## 文件

修改 `src/apis/datasourceConnectionApi.ts`、`src/apis/index.ts`、`src/types/apis/datasourceConnectionType.ts`、`src/types/index.ts`、`src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue`、`tests/datasource-schema-flow.test.mjs`、`docs/20261102/1.datasourceConnectionApi.md`。新增本 Plan，无删除文件、无新增依赖。

## 实现

独立新增请求类型和 API，经公共出口导出。仅未绑定空间查询字段时分流，复用现有字段、主键及外键响应类型和处理流程，校验数据源 ID，保留错误提示、防重复和过期响应保护。

## 验证

先增加新接口路径、参数、未绑定分流及已绑定兼容测试并确认失败，再实现。执行定向测试、npm test、test:coverage；依次执行 check:types-conventions、type-check、build:verify；限定文件格式、diff 与工作区检查。保留已有选表接口修改。浏览器工具不可用，真实后端联调及人工验收待执行。

## 实施与验证记录

- 已新增字段查询 API、请求类型及公共出口；未绑定空间发送 `id`、`schemaName`、逗号分隔且保留大小写的 `tableNames`。已绑定分支保留原接口和参数，后续字段、主键、外键及构建数据处理不变。
- RED：38 项定向测试中 2 项因新接口未实现失败；实现并补边界后，定向测试 40 / 40 通过，覆盖已绑定兼容、属性编辑保留、失败重试、参数校验、防重复及过期响应。
- 类型规范、临时目录构建、限定文件格式及 `git diff --check` 通过；已检查任务 diff 和工作区状态，保留前一任务的选表变更。
- 全量测试 1216 项：1176 通过、40 项既有失败，与修改前失败集合一致，无新增失败。
- 类型检查仍有其他文件的 15 项既有错误，本次修改文件无类型错误。
- 已加载文件覆盖率：行 93.44%、分支 78.74%、函数 90.51%；分支低于 80% 且有既有测试失败，检查未通过，不代表全项目源码覆盖率。
- 真实后端、浏览器和人工验收未执行，整体必需检查尚未全部通过。
