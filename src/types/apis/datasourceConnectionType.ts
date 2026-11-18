export interface DatasourceConnectionParam {
  name: string;
  dbType: string;
  driverClass?: string;
  jdbcUrl: string;
  host?: string;
  port?: number;
  dbName?: string;
  schemaName?: string;
  username: string;
  password?: string;
  description?: string;
  status?: number;
}

export interface DatasourceConnectionItem {
  id: number;
  /** 历史空间关联，仅用于兼容读取，不写入连接。 */
  spaceId?: number;
  name: string;
  dbType: string;
  driverClass?: string;
  jdbcUrl: string;
  host?: string;
  port?: number;
  dbName?: string;
  schemaName?: string;
  username?: string;
  description?: string;
  status?: number;
  createTime?: string;
  updateTime?: string;
}

export interface DatasourceConnectionPage {
  size: number;
  current: number;
  records: DatasourceConnectionItem[];
  total: number;
  pages?: number;
}

export interface ListDatasourceConnectionsParams {
  keyword?: string;
  status?: number;
  pageNum?: number;
  pageSize?: number;
}

export interface DatasourceTableSummary {
  tableName: string;
  tableComment?: string;
  columnCount: number;
}

export interface DatasourceColumn {
  columnName: string;
  nativeType: string;
  description?: string;
  isPrimaryKey: boolean;
  ontologyDataType?: string;
}

export interface DatasourceForeignKeyCandidate {
  masterTable: string;
  masterColumn: string;
  childTable: string;
  childColumn: string;
  origin: "DECLARED" | "HEURISTIC";
}

export interface DatasourceTableDetail {
  tableName: string;
  tableComment?: string;
  primaryKeyColumns: string[];
  columns: DatasourceColumn[];
  foreignKeys: DatasourceForeignKeyCandidate[];
}

export type ListDatasourceTableColumnsParams = ListDatasourceTablesParams & {
  tableNames: string[];
};

export interface DatasourceSchema {
  schemaName: string;
  catalogName?: string;
}

export interface ListDatasourceSchemasParams {
  spaceId: number;
  datasourceId?: number;
}

export type ListDatasourceTablesParams = ({ datasourceId: number; spaceId?: never } | { spaceId: number; datasourceId?: never }) & {
  schemaName: string;
};
