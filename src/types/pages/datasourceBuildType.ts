export type DatasourceDbType = "mysql" | "postgresql";

export interface DatasourceField {
  id: string;
  name: string;
  dataType: string;
}

export interface DatasourceTable {
  id: string;
  name: string;
  storageName: string;
  comment: string;
  fields: DatasourceField[];
}

export interface DatasourceConnection {
  dbType: DatasourceDbType;
  host: string;
  port: number;
  database: string;
  schemaName: string;
  username: string;
  password: string;
}

export interface DatasourceBuildSelection {
  datasourceId: number;
  primaryTableId: string;
  selectedTableIds: string[];
  selectedTables: DatasourceTable[];
  fieldIdsByTable: Record<string, string[]>;
  foreignKeys: Record<string, { childFieldId: string; parentFieldId: string }>;
}
