import type { OntologyPropertyInfo } from "./getOntologyPropertyByOntologyIdType";

/** 对象属性分类树查询请求参数。 */
export interface GetOntologyObjectArrTypeTreeParams {
  ontologyUniqueIdentifier: string;
}

/** 对象属性分类树节点。 */
export interface GetOntologyObjectArrTypeTreeData {
  categoryId: number;
  name: string;
  propertyInfos?: OntologyPropertyInfo[];
  children?: GetOntologyObjectArrTypeTreeData[];
}
