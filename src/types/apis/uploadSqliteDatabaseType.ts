/** 上传 SQLite 数据库文件的请求参数。 */
export interface UploadSqliteDatabaseParams {
  /** SQLite 数据库文件（.db / .sqlite / .sqlite3）。 */
  file: File;
}

/** 上传 SQLite 数据库文件的响应 data。 */
export interface UploadSqliteDatabaseData {
  /** 可直接提交的 JDBC 连接串。 */
  jdbcUrl: string;
  /** 向导后续步骤回传的 schema 名；SQLite 固定 main。 */
  schemaName: string;
  /** 数据库文件在服务端落地的绝对路径。 */
  path: string;
  /** 上传时的原始文件名。 */
  fileName: string;
  /** 文件字节数。 */
  size: number;
  /** 上传后立即扫到的表数量；0 表示能连上但没有用户表。 */
  tableCount: number;
}
