import type { ManagementWorkspaceTab } from "./ontologySpaceManagementDetailType";

/** 实体浏览详情路由名称。 */
export type EntityBrowsingRouteName =
  | "EntityBrowsingObject"
  | "EntityBrowsingRelation"
  | "EntityBrowsingFunctionOperator"
  | "EntityBrowsingBehavior"
  | "EntityBrowsingBehaviorSchedule"
  | "EntityBrowsingObjectProfile";

/** 实体浏览顶部统计卡片。 */
export interface EntityBrowseStatisticCard {
  /** 卡片标识。 */
  id: "ontology" | "relation" | "entity";
  /** 展示文案。 */
  label: string;
  /** 数值。 */
  value: number;
  /** 图标名。 */
  icon: "Box" | "Share" | "Connection";
}

/** 实体浏览质量情况卡片。 */
export interface EntityBrowseQualityCard {
  /** 卡片标识。 */
  id: "resilience" | "attributeFill";
  /** 展示文案。 */
  label: string;
  /** 原始数值；填充率用 0-100。 */
  value: number;
  /** 展示值，可为带百分号的字符串。 */
  displayValue: string;
  /** 图标名。 */
  icon: "Medal" | "DataLine";
}

/** 实体浏览顶部概览。 */
export interface EntityBrowseOverview {
  /** 统计信息卡片。 */
  statistics: EntityBrowseStatisticCard[];
  /** 质量情况卡片。 */
  quality: EntityBrowseQualityCard[];
}

/** 实体浏览 Mock 原始数据。 */
export interface EntityBrowseOverviewMockData {
  /** 对象数量。 */
  ontologyCount: number;
  /** 关系数量。 */
  relationCount: number;
  /** 实体数量。 */
  entityCount: number;
  /** 韧性标准应用数。 */
  resilienceStandardCount: number;
  /** 属性填充率（0-100）。 */
  attributeFillRate: number;
}

/** 实体浏览工作区 Tab 路由映射键。 */
export type EntityBrowsingTab = ManagementWorkspaceTab;
