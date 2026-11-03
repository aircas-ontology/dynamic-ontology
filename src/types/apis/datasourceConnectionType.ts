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

export interface ListDatasourceTableColumnsParams {
  datasourceId: number;
  tableNames: string[];
}
