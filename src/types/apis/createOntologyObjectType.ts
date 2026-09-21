/** 创建本体对象请求参数。 */
export interface CreateOntologyObjectParams {
  spaceId: number;
  displayName: string;
  apiName: string;
  iconUrl?: string;
  description?: string;
  parentOntologyUniqueIdentifier?: number;
  categoryId?: number;
  groupIds?: string[];
}

/** 创建本体对象响应数据。 */
export interface CreateOntologyObjectData {
  uniqueIdentifier: string;
}
