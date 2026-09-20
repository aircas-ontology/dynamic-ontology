export interface PropertyDatasourceParam {
  [key: string]: unknown;
}

export interface CreateOntologyPropertyParams {
  ontologyIdentifier: string;
  datasource?: PropertyDatasourceParam;
  schemaName: string;
  datasourceId: string;
  datasourceColumnName: string;
  dataType: string;
  description: string;
  displayName: string;
  apiName: string;
  isPrimaryKey: boolean;
  isTitleKey: boolean;
  type?: string;
  defaultValue?: string;
  storageGroup: string;
  categoryId?: number;
  metadata?: Record<string, unknown>;
}

export type CreateOntologyPropertyData = undefined;
