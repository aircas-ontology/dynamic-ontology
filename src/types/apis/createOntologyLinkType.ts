/** 创建本体之间关系请求体。 */
export interface CreateOntologyLinkParams {
  name: string;
  ontologyUniqueIdentifierFrom: string;
  ontologyUniqueIdentifierTo: string;
  categoryId?: number;
  apiName: string;
  comment?: string;
  spaceId: number;
}
