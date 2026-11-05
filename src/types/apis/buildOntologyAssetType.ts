/** 资产构建时创建的对象属性。 */
export interface BuildOntologyAssetProperty {
  displayName: string;
  apiName: string;
  dataType: string;
  description: string;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isTitleKey: boolean;
  storageGroup: string;
  metadata?: Record<string, Record<string, string>>;
}

/** 资产构建对象请求。 */
export interface BuildOntologyAssetParams {
  spaceId: number;
  displayName: string;
  apiName: string;
  description?: string;
  iconUrl?: string;
  parentOntologyUniqueIdentifier?: string;
  categoryId?: number;
  groupIds: string[];
  properties: BuildOntologyAssetProperty[];
}

/** 资产构建返回的对象标识。 */
export interface BuildOntologyAssetData {
  uniqueIdentifier: string;
}
