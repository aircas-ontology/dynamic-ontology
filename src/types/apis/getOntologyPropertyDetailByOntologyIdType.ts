import type { OntologyPropertyInfo } from "./getOntologyPropertyByOntologyIdType";

/** 根据对象标识查询属性详情的参数。 */
export interface GetOntologyPropertyDetailByOntologyIdParams {
  ontologyUniqueIdentifier: string;
}

/** 带数据源关联信息的对象属性详情。 */
export interface OntologyPropertyDetail extends OntologyPropertyInfo {
  datasourceColumnName?: string;
  datasourceId?: string;
  datasourceDescription?: string;
}

/** 根据对象标识查询到的属性详情列表。 */
export type GetOntologyPropertyDetailByOntologyIdData = OntologyPropertyDetail[];
