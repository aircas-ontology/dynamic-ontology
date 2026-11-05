/** 行为测试请求体。 */
export interface TestOntologyActionParams {
  /** 对象空间 id。 */
  ontologySpaceId: string;
  /** 行为 api。 */
  actionApi: string;
  /** 行为挂载侧实体主键。 */
  entityPrimaryKey: string | number | boolean | Record<string, unknown>;
  /** 分组表行主键；属性值修改/删除必填。 */
  dataPrimaryKey?: string | number | boolean | Record<string, unknown>;
  /** 关系对端实体主键；实例关系行为必填。 */
  linkEntityPrimaryKey?: string | number | boolean | Record<string, unknown>;
  /** 外部输入参数取值（参数名 -> 值）。 */
  params?: Record<string, unknown>;
}

/** 行为测试业务结果。 */
export interface TestOntologyActionResult {
  /** 行为 api。 */
  actionApi: string;
  /** 本次落库动作说明。 */
  message: string;
  /** 算子返回结果（JSON）；不绑算子时为空。 */
  result: string;
}

/** 行为测试响应 data；文档样例可为 null。 */
export type TestOntologyActionData = TestOntologyActionResult | null;
