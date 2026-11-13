/** 行为树试跑请求中按节点的执行数据。 */
export interface BehaviorTreeNodeExecuteData {
  /** 行为外部入参（参数名 -> 值）。 */
  params?: Record<string, unknown>;
  /** 单对象实例主键。 */
  entityPrimaryKey?: string | number;
  /** 多对象或关系两端实例；关系保留键 from / to。 */
  entityPrimaryKeys?: Record<string, string | number>;
  /** 取对象属性的入参按参数指定读实例/行。 */
  inputParams?: Record<
    string,
    {
      entityPrimaryKey?: string | number;
      dataPrimaryKeys?: Record<string, string | number>;
    }
  >;
  /** 写回属性出参位置。 */
  outputParams?: Record<
    string,
    {
      entityPrimaryKey?: string | number;
      dataPrimaryKeys?: Record<string, string | number>;
    }
  >;
  /** 仅写分组行时的行主键。 */
  dataPrimaryKey?: string | number;
}

/** 行为树试跑请求体。 */
export interface PostOntologyActionTreeTestParams {
  ontologySpaceId: number | string;
  /** 行为树 api（与详情 actionApi 相同）。 */
  treeApi: string;
  /** 黑板外部输入覆盖值。 */
  inputs?: Record<string, unknown>;
  /** 黑板对象属性键按对象选的实例。 */
  entityPrimaryKeys?: Record<string, string | number>;
  /** 按节点执行数据。 */
  nodeExecutes?: Record<string, BehaviorTreeNodeExecuteData>;
}

/** 行为树试跑响应 data（结构以后端为准，前端按未知对象展示）。 */
export type PostOntologyActionTreeTestData = Record<string, unknown> | null;
