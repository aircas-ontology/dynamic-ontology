# Plan：SQLite 上传文件并回填只读 JDBC URL

## 需求理解

数据源构建对象向导「新建连接」选择 `SQLITE` 时，需先上传 `.db` / `.sqlite` / `.sqlite3` 文件，调用 `POST /ontology/datasource/connection/sqlite/upload`，将返回的 `jdbcUrl` 回填到 JDBC URL；SQLite 下该输入框只读，只能靠上传写入。

## 修改范围

- 契约：类型、API、Mock、公共出口
- UI：`DatasourceBuildDialog` 上传控件、只读 JDBC URL、schema 使用 `main`
- 测试：API 契约 + 向导上传回填 / 失败 / 扩展名 / 切换库类型清理

## 新增、修改和删除文件

| 操作 | 路径                                                                           |
| ---- | ------------------------------------------------------------------------------ |
| 新增 | `src/types/apis/uploadSqliteDatabaseType.ts`                                   |
| 修改 | `src/types/index.ts`                                                           |
| 修改 | `src/apis/datasourceConnectionApi.ts`                                          |
| 修改 | `src/apis/index.ts`                                                            |
| 新增 | `src/mockData/fixtures/ontology/datasource/connection/sqlite/upload.post.json` |
| 修改 | `src/mockData/routes.json`                                                     |
| 修改 | `src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue`          |
| 新增 | `tests/upload-sqlite-database-api.test.mjs`                                    |
| 修改 | `tests/datasource-schema-flow.test.mjs`                                        |
| 新增 | 本 Plan 文件                                                                   |

## 核心实现方式

1. `postUploadSqliteDatabaseInterface({ file })`：`FormData` 字段 `file`，域 `ONTOLOGYMANAGE_URL`。
2. SQLITE：JDBC URL `readonly`；下方 `el-upload`（或等效文件选择）上传；成功写入 `jdbcUrl` 并失效已测连接。
3. 新建/历史 SQLite 的 `schemaName` 使用 `main`（替换原先 `public`）。
4. `tableCount === 0` 提示无用户表，不阻断回填。
5. 上传异步：`idle/submitting/success/error`，防重复，关闭弹窗忽略过期响应；切换非 SQLITE 清空上传状态与 jdbcUrl。

## 新增依赖及必要性

无。

## 验证方式

TDD → `npm test` / `test:coverage` → `type-check` / `build:verify` / `check:types-conventions` / 任务文件 `format:check`。
