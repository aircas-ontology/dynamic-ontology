/** 创建对象之间关系请求体。 */
export interface CreateOntologyLinkParams {
  name: string;
  ontologyUniqueIdentifierFrom: string;
  ontologyUniqueIdentifierTo: string;
  categoryId?: number;
  apiName: string;
  description?: string;
  spaceId: number;
}
