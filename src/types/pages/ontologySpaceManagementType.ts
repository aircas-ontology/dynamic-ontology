/** 本体空间列表及内存演示使用的业务契约。 */
export interface OntologySpaceDraft {
  apiName: string;
  displayName: string;
  description: string;
  iconUrl: string;
}

/** 本体空间指标统计。 */
export interface OntologySpaceMetrics {
  ontology: number;
  behavior: number;
  relation: number;
  rule: number;
  source: number;
}

export interface OntologySpaceItem extends OntologySpaceDraft {
  id: string;
  category: string;
  metrics: OntologySpaceMetrics;
  createdTime: string;
  updatedTime: string;
  isSubspace: boolean;
  parentSpaceDisplayName: string;
}

export type OntologySpaceSortOrder = "asc" | "desc";
export type OntologyViewMode = "table" | "card";
export type OntologySpaceAction = "enter" | "edit" | "subspace" | "export" | "delete";
export type OntologySpaceCommandStatus = "idle" | "submitting" | "success" | "error";
export type OntologySpaceLoadStatus = "loading" | "success" | "empty" | "error";

export interface OntologySpaceSummary {
  id: string;
  label: string;
  value: number;
  icon: "Box" | "Connection" | "Share" | "Link";
}
