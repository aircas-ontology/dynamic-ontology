# 数据源构建连接流程

已获用户确认。

## 需求与范围

进入向导查询连接，优先使用历史空间关联，否则选择已有连接或新建达梦、SQLite、PostgreSQL连接。连接操作不关联空间，新建不传spaceId；无schema默认public；最终构建不传数据源ID。

## 文件

修改DatasourceBuildDialog.vue、OntologyObjectCreateDialog.vue、datasourceConnectionApi.ts及API出口、datasourceConnectionType.ts及类型出口、两份现有数据源API文档、datasource-schema-flow.test.mjs；新增本Plan。无删除文件，无新依赖。

## 实现

复用连接查询、测试和创建接口；按数据源ID查询schema/表/字段；保留原空间查询兼容路径及后续构建字段流程。连接列表分页完整读取，防重复和过期响应；SQLite隐藏schema。

## 验证

先补行为测试验证失败，再实现通过；执行npm test、test:coverage、check:types-conventions、type-check、build:verify和限定文件格式检查。浏览器工具不可用时记录运行时与人工验收缺口。保留无关修改。

## 2026-11-18 续办记录

- 已接入已有连接、新建达梦 / SQLite / PostgreSQL 连接、测试后创建、历史空间关联优先选择和完整分页读取。
- schema、表和字段使用数据源 ID 查询，保留空间查询兼容路径；连接创建不绑定空间，最终构建仍不传数据源 ID。
- 已覆盖重复调用、请求失败、过期响应、切换连接与卸载场景；初始定向测试 9 项失败，实现后通过。新增清空连接的异步回归用例先失败后修复。
- API 和类型出口已有所需导出，无需修改；没有新增依赖或删除文件。
- 浏览器控制工具和 E2E 入口不可用，暗亮主题、键盘焦点、弹窗溢出及真实数据库联调留待人工验收。

### 验证结果

- 定向行为测试：20 / 20 通过；类型规范、临时目录构建、限定文件格式检查和 `git diff --check` 通过。
- `npm test`：1194 项中 1157 通过、37 失败；与续办前基线比较无新增失败，原数据源相关 9 项失败已消除。
- `npm run type-check`：仍有其他文件的 14 项既有错误，本次修改文件无类型错误。
- `npm run test:coverage`：已加载文件行覆盖率 93.41%、分支 78.85%、函数 90.41%；分支低于 80%，且有上述既有测试失败，因此未通过。该统计不代表全部项目源码覆盖率。
- `npm run check:project-conventions`：未通过，涉及历史文档失效链接、现有 Prettier 受保护目录排除配置及其他组件未定义主题变量；未扩大范围修改。
- 实现已落地，但全仓必需检查尚未全部通过，浏览器验证和人工验收未完成。
