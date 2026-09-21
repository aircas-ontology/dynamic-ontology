/** 根据分类查询本体对象列表的请求参数。 */
export interface GetOntologyObjectByCategoryIdParams {
  categoryId?: number;
}

/** 根据分类查询返回的本体元数据。 */
export interface OntologyObjectQueryItem {
  uniqueIdentifier?: string;
  createTime?: string;
  updateTime?: string;
  latestQueryTime?: string;
  icon?: string;
  displayName?: string;
  description?: string;
  apiName?: string;
  metaGroupId?: string[];
  spaceId?: number;
  ontologyCategoryId?: number;
  parentOntologyUniqueIdentifier?: string;
  parentOntologyDisplayName?: string;
  entityCount?: number;
  relationCount?: number;
  propertyCount?: number;
  actionCount?: number;
}

/** 根据分类查询接口的 data 响应数组。 */
export type GetOntologyObjectByCategoryIdData = OntologyObjectQueryItem[];
