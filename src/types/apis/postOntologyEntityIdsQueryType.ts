/** 按对象与实体主键批量查询主属性的单项请求。 */
export interface OntologyEntityIdsQueryParam {
  /** 对象 id。 */
  ontologyUniqueIdentifier?: string;
  /** 实体主键值列表。 */
  entityPrimaryKeys?: unknown[];
}

/** 批量查询主属性请求体。 */
export type PostOntologyEntityIdsQueryParams = OntologyEntityIdsQueryParam[];

/** 实体主属性单项。 */
export interface OntologyEntityIdsQueryProperty {
  /** 属性 api 名称。 */
  propertyApiName?: string;
  /** 属性展示名称；OpenAPI 或写为 propertyName。 */
  propertyDisplayName?: string;
  /** OpenAPI Schema 字段名，与 propertyDisplayName 兼容。 */
  propertyName?: string;
  /** 属性值。 */
  propertyValue?: unknown;
}

/** 单个实体主属性信息。 */
export interface OntologyEntityIdsQueryEntityInfo {
  ontologyUniqueIdentifier?: string;
  ontologyName?: string;
  primaryKey?: unknown;
  displayName?: string;
  properties?: OntologyEntityIdsQueryProperty[];
}

/** 按对象分组的主属性查询结果。 */
export interface OntologyEntityIdsQueryItem {
  ontologyUniqueIdentifier?: string;
  entityList?: OntologyEntityIdsQueryEntityInfo[];
}

/** 批量查询实体主属性响应 data。 */
export type PostOntologyEntityIdsQueryData = OntologyEntityIdsQueryItem[] | null;
