import type { OntologyPropertyInfo } from "./getOntologyPropertyByOntologyIdType";

/** 本体对象属性分类树查询请求参数。 */
export interface GetOntologyObjectArrTypeTreeParams {
  ontologyUniqueIdentifier: string;
}

/** 本体对象属性分类树节点。 */
export interface GetOntologyObjectArrTypeTreeData {
  categoryId: number;
  name: string;
  propertyInfos?: OntologyPropertyInfo[];
  children?: GetOntologyObjectArrTypeTreeData[];
}
