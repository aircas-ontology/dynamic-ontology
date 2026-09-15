/** 本体空间列表及内存演示使用的业务契约。 */
export interface OntologySpaceDraft {
  apiName: string;
  displayName: string;
  description: string;
  iconUrl: string;
}

export interface OntologySpaceItem extends OntologySpaceDraft {
  id: string;
  category: string;
  metrics: { ontology: number; behavior: number; relation: number; rule: number; source: number };
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  isSubspace: boolean;
  parentSpaceDisplayName: string;
}

export type OntologySpaceSortOrder = "asc" | "desc";
export type OntologyViewMode = "table" | "card";

export interface OntologySpaceSummary {
  id: string;
  label: string;
  value: number;
  icon: "Box" | "Connection" | "Share" | "Link";
}
