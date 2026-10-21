/** 空间内管理工作区 Tab 标识。 */
export type ManagementWorkspaceTab = "object" | "relation" | "function-operator" | "behavior" | "behavior-schedule";

export type OntologySpaceDetailRouteName =
  | "OntologySpaceManagementDetailObject"
  | "OntologySpaceManagementDetailRelation"
  | "OntologySpaceManagementDetailFunctionOperator"
  | "OntologySpaceManagementDetailBehavior"
  | "OntologySpaceManagementDetailBehaviorSchedule";

export type OntologySpaceDetailLoadStatus = "loading" | "ready" | "empty" | "error";

export interface OntologySpaceOverview {
  spaceId: string;
  counts: Partial<Record<ManagementWorkspaceTab, number>>;
  availableTabs: ManagementWorkspaceTab[];
}

export type OntologyObjectViewMode = "card" | "table";

export interface OntologyObjectMetrics {
  attribute: number;
  relation: number;
  behavior: number;
}

export interface OntologyObjectItem {
  id: string;
  categoryId: string;
  displayName: string;
  apiName: string;
  description: string;
  parentDisplayName: string;
  createdAt: string;
  iconUrl: string;
  metrics: OntologyObjectMetrics;
}

export interface OntologyObjectCreateDraft {
  apiName: string;
  displayName: string;
  description: string;
  iconUrl: string;
  categoryId: string;
  parentId?: string;
}

export interface OntologyObjectSection {
  categoryId: string;
  name: string;
  items: OntologyObjectItem[];
}

/** 概念层级树中对象的引用信息。 */
export interface OntologyConceptObjectRef {
  /** 对象唯一标识，用于跳转对象详情。 */
  uniqueIdentifier: string;
  /** 对象显示名称。 */
  displayName: string;
}

export interface OntologyConceptNode {
  id: string;
  label: string;
  count: number;
  objects?: OntologyConceptObjectRef[];
  targetCategoryId?: string;
  children: OntologyConceptNode[];
}

export interface OntologyObjectWorkspace {
  spaceId: string;
  tree: OntologyConceptNode[];
  sections: OntologyObjectSection[];
}

export interface OntologyObjectLocationTarget {
  categoryId: string;
  /** 需要定位高亮的对象 id；缺省时仅定位分类分区。 */
  objectId?: string;
  requestId: number;
}
