/** 查询两端实体关联关系请求体。 */
export interface PostOntologyEntityAllLinkParams {
  /** From 侧对象 id。 */
  ontologyUniqueIdentifierFrom: string;
  /** From 侧实体主键。 */
  entityPrimaryKeyFrom: string | number;
  /** To 侧对象 id。 */
  ontologyUniqueIdentifierTo: string;
  /** To 侧实体主键。 */
  entityPrimaryKeyTo: string | number;
}

/** 两端实体关联关系持续时段。 */
export interface PostOntologyEntityAllLinkVisibilityWindow {
  /** 时段开始时间。 */
  startTime?: string | number | null;
  /** 时段结束时间。 */
  endTime?: string | number | null;
}

/** 两端实体之间的一条关联关系。 */
export interface PostOntologyEntityAllLinkItem {
  /** 关系名称。 */
  linkName?: string | null;
  /** 关系类型。 */
  linkType?: string | null;
  /** From 侧对象标识。 */
  ontologyFrom?: string | null;
  /** To 侧对象标识。 */
  ontologyTo?: string | null;
  /** From 侧实体主键。 */
  entityPrimaryKeyFrom?: string | number | null;
  /** To 侧实体主键。 */
  entityPrimaryKeyTo?: string | number | null;
  /** From 侧实体节点。 */
  entityNodeFrom?: string | null;
  /** From 侧展示名。 */
  displayNameFrom?: string | null;
  /** To 侧实体节点。 */
  entityNodeTo?: string | null;
  /** To 侧展示名。 */
  displayNameTo?: string | null;
  /** 关系整体开始时间。 */
  startTime?: string | number | null;
  /** 关系整体结束时间。 */
  endTime?: string | number | null;
  /** 持续时段列表。 */
  visibilityWindows?: PostOntologyEntityAllLinkVisibilityWindow[] | null;
  /** 关系状态。 */
  status?: string | null;
}

/** 查询两端实体关联关系业务数据。 */
export type PostOntologyEntityAllLinkData = PostOntologyEntityAllLinkItem[];
