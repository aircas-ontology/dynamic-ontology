/** 查询对象实体实例的请求参数。 */
export interface GetOntologyEntitiesParams {
  ontologyUniqueIdentifier: string;
  pageNum?: number;
  pageSize?: number;
}

/** 实体列表接口返回的单条属性值（OpenAPI EntityPropertyVO / 内网扩展）。 */
export interface OntologyEntityPropertyItem {
  propertyApiName?: string;
  propertyName?: string;
  /** 内网列表接口返回的属性中文显示名。 */
  propertyDisplayName?: string;
  propertyValue?: unknown;
}

/** 实体实例的主属性信息；动态属性字段由后端按对象定义返回。 */
export interface OntologyEntityInfo {
  id?: number | string;
  entityPrimaryKey?: number | string;
  ontologyUniqueIdentifier?: string;
  /** Mock 为键值对象；内网 OpenAPI 为属性值数组。 */
  properties?: Record<string, unknown> | OntologyEntityPropertyItem[];
  [propertyName: string]: unknown;
}

/** 对象实体实例分页数据。 */
export interface GetOntologyEntitiesData {
  records: OntologyEntityInfo[];
  total: number;
  size: number;
  current: number;
  pages?: number;
}
