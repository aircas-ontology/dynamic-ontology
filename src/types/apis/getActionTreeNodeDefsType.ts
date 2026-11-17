/** 行为树节点目录查询参数。 */
export interface GetActionTreeNodeDefsParams {
  /** 本体空间 id。 */
  ontologySpaceId: number;
}

/** 节点目录中的节点元信息。 */
export interface ActionTreeNodeDefMeta {
  kind: string;
  name?: string;
  category?: "COMPOSITE" | "DECORATOR" | "LEAF" | string;
  maxChildren?: number;
}

/** 可绑定行为的参数摘要。 */
export interface ActionTreeBindableParam {
  name: string;
  type?: string;
  description?: string;
  /** 行为声明的取值来源：EXTERNAL / PROPERTY / FIXED / OBJECT / LIST。 */
  sourceType?: string;
  /** 出参展示字段名；缺省时用 name。 */
  fieldName?: string;
}

/** 节点目录中可绑定的已发布行为。 */
export interface ActionTreeBindableAction {
  actionApi: string;
  displayName?: string;
  requiresInstance?: boolean;
  instanceObjects?: string[];
  inputParams?: ActionTreeBindableParam[];
  outputParams?: ActionTreeBindableParam[];
  externalParams?: ActionTreeBindableParam[];
  /** 可配置取值来源的入参（优先于 inputParams）。 */
  bindableInputs?: ActionTreeBindableParam[];
  /** 可回传黑板的出参（优先于 outputParams）。 */
  bindableOutputs?: ActionTreeBindableParam[];
}

/** 行为树节点目录响应 data。 */
export interface GetActionTreeNodeDefsData {
  nodes?: ActionTreeNodeDefMeta[];
  availableActions?: ActionTreeBindableAction[];
}
