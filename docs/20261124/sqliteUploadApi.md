# 接口名称

- 上传 SQLite 数据库文件（`.db` / `.sqlite` / `.sqlite3`）

## 编译位置

apis 与 types 文件名自行语义化命名

- apis：`src/apis/`
- types：`src/types/apis/`
- mocks：`src/mocks/`（如需）

## 接口描述

- 上传 SQLite 数据库文件；文件落盘目录为 `/sqlite-data`。
- 返回的 `jdbcUrl` 原样提交给 `POST /datasource/connection`（`dbType=SQLITE`）即可保存数据源。
- 上传时会尝试真实建连校验；非法文件返回 `400` 并删除已落盘文件。
- 在线文档相关模型：`RestResultSqliteDatabaseUploadVO`、`SqliteDatabaseUploadVO`。
- OpenAPI 路径为 `/datasource/connection/sqlite/upload`，服务前缀为 `/ontology`。项目请求路径使用加前缀后的完整路径。
- 请求体通过 `multipart/form-data` 传递文件，无 query / path 参数。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/datasource/connection/sqlite/upload`

## 请求方式

- POST

## 输入参数

- 无 query / path 请求参数。
- 请求体为 `multipart/form-data`：

| 参数名 | 位置 | 类型            | 必填 | 说明              |
| ------ | ---- | --------------- | ---- | ----------------- |
| `file` | body | string / binary | 是   | SQLite 数据库文件 |

请求示例：

```http
POST /ontology/datasource/connection/sqlite/upload
Content-Type: multipart/form-data

file=<sqlite-file>
```

## 输出参数

在线文档响应模型为 `RestResultSqliteDatabaseUploadVO`。该操作声明 HTTP `200`。`code`、`message`、`data` 及 `SqliteDatabaseUploadVO` 属性均未标记 required。下面取值仅说明字段结构。

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "jdbcUrl": "jdbc:sqlite:/sqlite-data/xxx-app.db",
    "schemaName": "main",
    "path": "/sqlite-data/xxx-app.db",
    "fileName": "app.db",
    "size": 102400,
    "tableCount": 3
  }
}
```

顶层字段（`RestResultSqliteDatabaseUploadVO`）：

| 字段名    | 类型                   | 必填 | 说明                      |
| --------- | ---------------------- | ---- | ------------------------- |
| `code`    | integer / int32        | 否   | 响应码                    |
| `message` | string                 | 否   | 消息描述                  |
| `data`    | SqliteDatabaseUploadVO | 否   | SQLite 数据库文件上传结果 |

`data`（`SqliteDatabaseUploadVO`）：

| 字段名       | 类型            | 必填 | 说明                                                                   |
| ------------ | --------------- | ---- | ---------------------------------------------------------------------- |
| `jdbcUrl`    | string          | 否   | 可直接提交的 JDBC 连接串，如 `jdbc:sqlite:/sqlite-data/xxx-app.db`     |
| `schemaName` | string          | 否   | 向导第②③步要回传的 schema 名；SQLite 固定 `main`（驱动本身不按它过滤） |
| `path`       | string          | 否   | 数据库文件在服务端落地的绝对路径                                       |
| `fileName`   | string          | 否   | 上传时的原始文件名                                                     |
| `size`       | integer / int64 | 否   | 文件字节数                                                             |
| `tableCount` | integer / int32 | 否   | 上传后立即扫到的表数量；`0` 表示能连上但没有用户表的库                 |

## 错误与边界

- 非法 SQLite 文件：HTTP / 业务失败（在线文档说明返回 `400`），服务端删除已落盘文件。
- 支持扩展名：`.db` / `.sqlite` / `.sqlite3`。

## 前端调用说明

- 使用 `FormData` 上传，字段名固定为 `file`。
- 成功后将 `data.jdbcUrl` 原样提交给 `POST /ontology/datasource/connection`，`dbType` 为 `SQLITE`。
- 向导后续 schema 相关步骤回传 `data.schemaName`（固定为 `main`）。
- `tableCount === 0` 时库可连接但无用户表，需在 UI 上给出明确提示。
