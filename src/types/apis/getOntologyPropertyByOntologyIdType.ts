export interface GetOntologyPropertyByOntologyIdParams {
  ontologyUniqueIdentifier: string;
}

export interface OntologyPropertyInfo {
  displayName?: string;
  apiName?: string;
  dataType?: string;
  description?: string;
  isPrimaryKey?: boolean;
  isTitleKey?: boolean;
  uniqueIdentifier?: string;
  ontologyUniqueIdentifier?: string;
  defaultValue?: string;
  storageGroup?: string;
  categoryId?: number;
  metadata?: Record<string, unknown>;
}

export type GetOntologyPropertyByOntologyIdData = OntologyPropertyInfo[];
