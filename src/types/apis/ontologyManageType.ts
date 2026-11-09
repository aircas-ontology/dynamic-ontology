/** 对象空间列表接口单条数据（契约样例字段）。 */
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
  /** 实体数量；后端暂未返回时由 Mock 补齐。 */
  entityCount?: number;
  createTime: string;
  updateTime: string;
}

/** 对象空间列表接口响应 data：空间数组。 */
export type OntologySpaceListData = OntologySpaceListItem[];
