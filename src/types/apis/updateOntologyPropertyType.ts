import type { PropertyDatasourceParam } from "./createOntologyPropertyType";

export interface UpdateOntologyPropertyParams {
  uniqueIdentifier: string;
  datasource?: PropertyDatasourceParam;
  schemaName: string;
  datasourceId: string;
  datasourceColumnName: string;
  displayName: string;
  dataType: string;
  description?: string;
  isTitleKey: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string;
  storageGroup: string;
  categoryId?: number;
  metadata?: Record<string, unknown>;
}

export type UpdateOntologyPropertyData = undefined;
