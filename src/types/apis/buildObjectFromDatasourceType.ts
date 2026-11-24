export interface BuildObjectFromDatasourceSelectedColumn {
  sourceColumnName: string;
  columnName: string;
  displayName?: string;
  /** 数据源字段说明。 */
  description?: string;
  /** 本体属性数据类型，对应向导「数据类型」列。 */
  dataType: string;
}

export interface BuildObjectFromDatasourceSelectedTable {
  sourceTableName: string;
  tableName: string;
  master?: boolean;
  columns: BuildObjectFromDatasourceSelectedColumn[];
}

export interface BuildObjectFromDatasourceForeignKey {
  masterTable: string;
  masterColumn: string;
  childTable: string;
  childColumn: string;
}

export interface BuildObjectFromDatasourceParams {
  spaceId: number;
  /** 所选数据源连接 ID，未提供时使用空间已绑定的数据源。 */
  datasourceId?: number;
  categoryId?: number;
  displayName: string;
  apiName: string;
  description?: string;
  schemaName: string;
  tables: BuildObjectFromDatasourceSelectedTable[];
  foreignKeys?: BuildObjectFromDatasourceForeignKey[];
}

export interface BuildObjectFromDatasourceData {
  uniqueIdentifier: string;
  apiName: string;
  displayName: string;
  propertyCount: number;
  entityTables: string[];
  mappingCount: number;
  message?: string;
}
