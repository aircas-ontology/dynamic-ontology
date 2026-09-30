/** 数据源表字段描述。 */
export interface OntologyDatasourceColumnDescVO {
  columnName: string;
  description: string;
  type: string;
  isPrimaryKey: boolean;
}

/** 查询数据源表字段列表的响应数据。 */
export type GetOntologyDatasourceColumnsData = OntologyDatasourceColumnDescVO[];

/** 查询数据源表字段列表的参数。 */
export interface GetOntologyDatasourceColumnsParams {
  spaceId: number;
  dataSourceId: string;
}
