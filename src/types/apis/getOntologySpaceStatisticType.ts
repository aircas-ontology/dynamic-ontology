/** 本体空间资源统计 VO。 */
export interface OntologySpaceStatisticVO {
  /** 本体空间 id。 */
  spaceId: number;
  /** 对象（本体）数量。 */
  ontologyCount: number;
  /** 关系数量。 */
  linkCount: number;
  /** 函数算子数量。 */
  functionCount: number;
  /** 行为数量。 */
  actionCount: number;
  /** 行为调度数量（规则+任务）。 */
  actionSchedulingCount: number;
}

/** 查询本体空间资源统计的响应 data。 */
export type GetOntologySpaceStatisticData = OntologySpaceStatisticVO;

/** 查询本体空间资源统计的查询参数。 */
export interface GetOntologySpaceStatisticParams {
  /** 本体空间 id，必填。 */
  spaceId: number;
}
