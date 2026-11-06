export type DatasourceDbType = "mysql" | "postgresql";

export interface DatasourceField {
  id: string;
  name: string;
  /** 构建对象时使用的属性名。 */
  propertyName?: string;
  dataType: string;
  /** 数据源字段是否为主键；接口未提供时保持未知。 */
  isPrimaryKey?: boolean;
  description?: string;
}

export interface DatasourceTable {
  id: string;
  name: string;
  /** 构建对象时使用的入库表名。 */
  targetName?: string;
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
  schemaName: string;
  primaryTableId: string;
  selectedTableIds: string[];
  selectedTables: DatasourceTable[];
  fieldIdsByTable: Record<string, string[]>;
  foreignKeys: Record<string, { childFieldId: string; parentFieldId: string }>;
}
