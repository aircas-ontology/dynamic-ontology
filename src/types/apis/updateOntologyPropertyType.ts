export interface UpdateOntologyPropertyParams {
  uniqueIdentifier: string;
  displayName: string;
  apiName: string;
  dataType: string;
  description?: string;
  isTitleKey: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string;
  storageGroup: string;
  categoryId?: number;
}

export type UpdateOntologyPropertyData = undefined;
