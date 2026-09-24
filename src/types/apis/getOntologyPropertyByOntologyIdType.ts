export interface GetOntologyPropertyByOntologyIdParams {
  ontologyUniqueIdentifier: string;
}

export interface OntologyPropertyInfo {
  displayName?: string;
  apiName?: string;
  propertyType?: string;
  description?: string;
  isPrimaryKey?: boolean;
  isTitleKey?: boolean;
  uniqueIdentifier?: string;
  ontologyUniqueIdentifier?: string;
  defaultValue?: string;
  storageGroup?: string;
  categoryId?: number;
  metadata?: Record<string, unknown>;
  datasourceColumnName?: string;
  datasourceId?: string;
  datasourceDescription?: string;
}

export type GetOntologyPropertyByOntologyIdData = OntologyPropertyInfo[];
