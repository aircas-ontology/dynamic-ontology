export interface BuildObjectFromDatasourceSelectedColumn {
  columnName: string;
  displayName?: string;
}

export interface BuildObjectFromDatasourceSelectedTable {
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
