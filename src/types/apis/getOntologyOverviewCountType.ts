/** 本体概览页面资源数量统计。 */
export interface OverviewCountVO {
  /** 本体空间数量。 */
  spaceCount?: number;
  /** 本体对象数量。 */
  ontologyCount?: number;
  /** 本体分组数量。 */
  groupCount?: number;
  /** 行为调度数量。 */
  actionSchedulingCount?: number;
  /** 行为数量。 */
  actionCount?: number;
  /** 函数数量。 */
  functionCount?: number;
  /** 属性数量。 */
  propertyCount?: number;
  /** 关系数量。 */
  linkCount?: number;
}

/** 获取本体概览统计接口的响应 data。 */
export type GetOntologyOverviewCountData = OverviewCountVO;
