/** 本体空间关系工作台业务契约。 */

export const ROOT_RELATION_CATEGORY_ID = "relation-all";

export const RELATION_CARDINALITIES = ["一对一", "一对多", "多对一", "多对多"] as const;

export type OntologyRelationCardinality = (typeof RELATION_CARDINALITIES)[number];

export type RelationViewMode = "graph" | "list";

export type RelationGraphLayoutMode = "star" | "network";

export type SpaceRelationHopLevel = 1 | 2 | 3;

export type OntologySpaceRelationLoadStatus = "loading" | "ready" | "empty" | "error";

export interface OntologyRelationCategoryNode {
  id: string;
  label: string;
  color?: string;
  children: OntologyRelationCategoryNode[];
}

export interface OntologyRelationClass {
  id: string;
  categoryId: string;
  categoryName: string;
  displayName: string;
  apiName: string;
  sourceName: string;
  targetName: string;
  cardinality: OntologyRelationCardinality;
  description: string;
}

export interface SpaceRelationObjectOption {
  value: string;
  label: string;
}

export interface SpaceRelationWorkspaceData {
  categoryTree: OntologyRelationCategoryNode[];
  relations: OntologyRelationClass[];
  objectOptions: SpaceRelationObjectOption[];
}

export interface SpaceRelationFilterState {
  seedNames: string[];
  maxHop: SpaceRelationHopLevel;
  applied: boolean;
}

export interface RelationCategoryWritePayload {
  parentId: string;
  name: string;
  color: string;
}

export interface RelationCategoryUpdatePayload {
  id: string;
  name: string;
  color: string;
}

export interface RelationClassWritePayload {
  categoryId?: string;
  displayName: string;
  apiName: string;
  sourceName: string;
  targetName: string;
  cardinality: OntologyRelationCardinality;
  description: string;
}

export interface RelationClassUpdatePayload extends RelationClassWritePayload {
  id: string;
}
