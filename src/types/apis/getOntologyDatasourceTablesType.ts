/** 本体空间数据源表视图对象。 */
export interface OntologyDatasourceTableVO {
  schemaName: string;
  tableName: string;
  description: string;
}

/** 本体空间数据源表分页结果。 */
export interface GetOntologyDatasourceTablesData {
  records: OntologyDatasourceTableVO[];
  total: number;
  size: number;
  current: number;
}

/** 查询本体空间数据源表列表的参数。 */
export interface GetOntologyDatasourceTablesParams {
  spaceId: number;
  keyword?: string;
  pageNum?: number;
  pageSize?: number;
}
