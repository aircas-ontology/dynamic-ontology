/** 批量查询对象实例的单个对象请求项。 */
export interface OntologyEntityQueryItem {
  ontologyUniqueIdentifier: string;
  entityPrimaryKeys: Array<string | number>;
}

/** 对象实例属性项。 */
export interface OntologyEntityQueryProperty {
  propertyApiName: string;
  propertyDisplayName: string;
  propertyValue: unknown;
}

/** 批量查询返回的对象实例。 */
export interface OntologyEntityQueryRecord {
  ontologyUniqueIdentifier: string;
  ontologyName: string;
  primaryKey: string | number;
  displayName: string;
  properties: OntologyEntityQueryProperty[];
}

/** 批量查询返回的单对象实例分组。 */
export interface OntologyEntityQueryGroup {
  ontologyUniqueIdentifier: string;
  entityList: OntologyEntityQueryRecord[];
}

/** 批量查询对象实例响应数据。 */
export type OntologyEntityQueryData = OntologyEntityQueryGroup[];
