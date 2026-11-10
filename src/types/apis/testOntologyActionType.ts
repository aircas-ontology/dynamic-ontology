/** 应用行为测试中单个参数的对象实例绑定。 */
export interface TestOntologyActionEntityBinding {
  /** 对象实例主键。 */
  entityPrimaryKey: string | number | boolean | Record<string, unknown>;
  /** 非 main 存储分组 → 数据行主键；main 或无需子表时省略。 */
  dataPrimaryKeys?: Record<string, string | number | boolean | Record<string, unknown>>;
}

/** 应用行为测试关系两端主键列表。 */
export interface TestOntologyActionLinkEntityPrimaryKeys {
  /** From 侧实例主键列表（可多选）。 */
  from: Array<string | number | boolean | Record<string, unknown>>;
  /** To 侧实例主键列表（可多选）。 */
  to: Array<string | number | boolean | Record<string, unknown>>;
}

/** 行为测试请求体。 */
export interface TestOntologyActionParams {
  /** 对象空间 id。 */
  ontologySpaceId: string;
  /** 行为 api。 */
  actionApi: string;
  /** 行为挂载侧实体主键；属性值/关系实例等场景必填，基础函数算子可不传。 */
  entityPrimaryKey?: string | number | boolean | Record<string, unknown>;
  /**
   * 关系两端实例主键：`from` / `to` 均为数组。
   * 应用行为仅在有 linkMapping 时传关系两端。
   */
  entityPrimaryKeys?: TestOntologyActionLinkEntityPrimaryKeys;
  /**
   * 应用行为测试入参绑定：参数名 → 实例绑定数组（可多选）。
   */
  inputParams?: Record<string, TestOntologyActionEntityBinding[]>;
  /**
   * 应用行为测试出参绑定：参数名 → 单个实例绑定（单选）。
   */
  outputParams?: Record<string, TestOntologyActionEntityBinding>;
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
