/** 查询本体对象实体实例的请求参数。 */
export interface GetOntologyEntitiesParams {
  ontologyUniqueIdentifier: string;
  pageNum?: number;
  pageSize?: number;
}

/** 实体实例的主属性信息；动态属性字段由后端按对象定义返回。 */
export interface OntologyEntityInfo {
  id?: number | string;
  entityPrimaryKey?: number | string;
  ontologyUniqueIdentifier?: string;
  properties?: Record<string, unknown>;
  [propertyName: string]: unknown;
}

/** 本体对象实体实例分页数据。 */
export interface GetOntologyEntitiesData {
  records: OntologyEntityInfo[];
  total: number;
  size: number;
  current: number;
  pages?: number;
}
