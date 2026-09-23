/** 本体对象资源统计 VO。 */
export interface OntologyMetaStatisticVO {
  /** 本体 id。 */
  uniqueIdentifier: string;
  /** 实例数量。 */
  entityCount: number;
  /** 属性数量。 */
  propertyCount: number;
  /** 关系数量。 */
  relationCount: number;
  /** 行为数量。 */
  actionCount: number;
}

/** 统计本体对象资源数量的响应 data。 */
export type GetOntologyMetaStatisticData = OntologyMetaStatisticVO;

/** 统计本体对象资源数量的查询参数。 */
export interface GetOntologyMetaStatisticParams {
  /** 本体唯一标识，必填。 */
  uniqueIdentifier: string;
}
