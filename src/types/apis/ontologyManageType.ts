/** 本体空间列表接口单条数据（契约样例字段）。 */
export interface OntologySpaceListItem {
  iconUrl: string;
  displayName: string;
  apiName: string;
  description: string;
  spaceId: number;
  ontologyCount: number;
  actionCount: number;
  propertyCount: number;
  linkCount: number;
}

/** 本体空间列表接口响应 data：空间数组。 */
export type OntologySpaceListData = OntologySpaceListItem[];
