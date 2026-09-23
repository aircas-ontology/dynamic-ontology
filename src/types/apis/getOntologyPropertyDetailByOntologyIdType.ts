import type { OntologyPropertyInfo } from "./getOntologyPropertyByOntologyIdType";

/** 根据本体标识查询属性详情的参数。 */
export interface GetOntologyPropertyDetailByOntologyIdParams {
  ontologyUniqueIdentifier: string;
}

/** 带数据源关联信息的本体属性详情。 */
export interface OntologyPropertyDetail extends OntologyPropertyInfo {
  datasourceColumnName?: string;
  datasourceId?: string;
  datasourceDescription?: string;
}

/** 根据本体标识查询到的属性详情列表。 */
export type GetOntologyPropertyDetailByOntologyIdData = OntologyPropertyDetail[];
