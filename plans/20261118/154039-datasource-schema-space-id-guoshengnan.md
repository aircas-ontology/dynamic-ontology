# Schema 查询补充空间标识

已获用户确认。

## 需求与范围

schema 查询在选择连接时同时传当前空间 `spaceId` 和所选 `datasourceId`，兼容仅传 `spaceId` 的空间绑定查询。不更改绑定关系、表和字段查询参数或最终构建数据。

## 修改文件

- `src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue`
- `src/types/apis/datasourceConnectionType.ts`
- `src/apis/datasourceConnectionApi.ts`
- `tests/datasource-schema-flow.test.mjs`
- `docs/20261102/1.datasourceConnectionApi.md`
- 新增本 Plan，无删除文件、无新增依赖。

## 实现方式

schema 参数独立要求空间 ID、可选数据源 ID；表和字段保留原标识互斥约束。schema 调用补空间 ID，并验证有效空间标识。更新接口说明和行为回归测试。

## 验证方式

先更新测试并确认失败，再实现修复。执行定向测试、npm test、test:coverage、check:types-conventions、type-check、build:verify、限定文件格式检查及 diff 检查。保留无关修改；浏览器工具不可用，后端同时传两个标识时的选择优先级留待联调验收。

## 实施与验证记录

- 已补充 schema 请求的空间参数，保持仅空间查询以及表、字段查询的原有参数形式；未修改空间绑定关系或最终构建数据。
- RED：更新同时传两个标识的行为期望后，20 项定向测试中 1 项失败；修复后 20 项全部通过，包含仅空间查询、连接分页和字段查询回归。
- 类型规范、临时目录构建和限定文件格式检查通过；任务 diff 及工作区状态已核对，保留已有无关修改。
- 全量测试 1194 项：1157 通过、37 项既有失败，与修复前失败集合一致。类型检查仍有其他文件的 14 项既有错误，本次修改文件无类型错误。
- 覆盖率检查未通过：已加载文件行 93.41%、分支 78.83%、函数 90.41%；分支低于 80%，并存在上述既有测试失败。该统计不代表全项目源码覆盖率。
- 浏览器验证、真实后端联调及人工验收未执行。整体必需验证仍未全部通过。
