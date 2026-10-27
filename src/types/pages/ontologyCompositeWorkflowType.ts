/** 参数摘要（详情缓存）。 */
export interface CompositeWorkflowParamBrief {
  paramName: string;
  paramType: string;
  /** 对象或列表的下级属性；无下级时省略。 */
  fields?: CompositeWorkflowParamBrief[];
  /** 多路径汇聚时，标识该输出来自哪个上游节点。 */
  sourceNodeId?: string;
}

/** 函数节点入参绑定：手填或取自唯一前驱输出叶子。paramPath / upstreamParamPath 为从根到叶子的参数名。 */
export type CompositeWorkflowInputBinding =
  | { mode: "manual"; paramName: string; paramPath: string[]; value: string }
  | { mode: "fromUpstream"; paramName: string; paramPath: string[]; upstreamParamName: string; upstreamParamPath: string[]; sourceNodeId?: string };

/** 循环节点配置（foreach：集合取自上游路径，body/done 双出口）。 */
export interface CompositeWorkflowLoopConfig {
  kind: "loop";
  collection: { mode: "fromUpstream"; upstreamParamName: string; upstreamParamPath: string[] };
  itemParamName: string;
  /** 可选索引变量名；未配置时不向循环体暴露 index。 */
  indexParamName?: string;
  maxIterations?: number;
}

/** 条件分支比较运算符。 */
export type CompositeWorkflowBranchOperator = "eq" | "ne" | "gt" | "gte" | "lt" | "lte";

/** 条件分支节点配置（左值取上游输出路径，右值手填比较值）。 */
export interface CompositeWorkflowBranchConfig {
  kind: "branch";
  left: { mode: "fromUpstream"; upstreamParamName: string; upstreamParamPath: string[] };
  operator: CompositeWorkflowBranchOperator;
  right: { mode: "manual"; value: string };
  /** 后端回显保留的原表达式；有值时编译优先使用，避免 operator/right 翻译不可逆丢失。 */
  rawExpression?: string;
}

/** JSON 映射规则。 */
export interface CompositeWorkflowJsonMappingRule {
  /** 输出字段名。 */
  outputField: string;
  /** 映射类型：direct=直接取值, transform=简单转换, constant=常量。 */
  mappingType: "direct" | "transform" | "constant";
  /** 输入字段路径（direct/transform 时使用，支持点分路径如 "user.name"）。 */
  inputPath?: string;
  /** 常量值（constant 时使用）。 */
  constantValue?: string | number | boolean | null;
  /** 转换表达式（transform 时使用，如 "toUpperCase()", "parseInt()"）。 */
  transformExpression?: string;
}

/** 数据格式转换节点配置（JSON 结构映射或脚本；弹框当前仍以脚本为主）。 */
export interface CompositeWorkflowTransformConfig {
  kind: "transform";
  /** 映射模式：json=JSON 结构映射, script=脚本。 */
  mappingMode: "json" | "script";
  /** JSON 映射规则列表。 */
  mappings?: CompositeWorkflowJsonMappingRule[];
  /** 脚本模式时的语言。 */
  language?: "typescript" | "groovy" | "javascript";
  /** 脚本模式时的代码。 */
  code?: string;
  /** 解析得到的 INPUT / OUTPUT 树；确定解析成功后写入。 */
  paramsSnapshot?: { inputs: CompositeWorkflowParamBrief[]; outputs: CompositeWorkflowParamBrief[] };
  /** 下游入参叶子绑定；无前驱时多为 manual。 */
  inputBindings?: CompositeWorkflowInputBinding[];
  /**
   * 旧版手填输出 key；新节点不再写入。
   * @deprecated 优先使用 paramsSnapshot.outputs。
   */
  outputKeys?: string[];
}

/** Switch Case 单条 case（id 稳定，供锚点与边关联；value 为手填匹配值）。 */
export interface CompositeWorkflowSwitchCaseItem {
  id: string;
  value: string;
}

/** Switch Case 节点配置（switch 值取上游输出路径，cases 手填）。 */
export interface CompositeWorkflowSwitchConfig {
  kind: "switch";
  switchOn: { mode: "fromUpstream"; upstreamParamName: string; upstreamParamPath: string[] };
  cases: CompositeWorkflowSwitchCaseItem[];
}

/** 画布节点业务 kind。 */
export type CompositeWorkflowNodeKind = "function" | "loop" | "branch" | "transform" | "switch" | "start" | "end";

/** 保存载荷中的函数节点。 */
export interface CompositeWorkflowFunctionNodePayload {
  id: string;
  kind: "function";
  functionId: string;
  version: string;
  displayName: string;
  inputBindings: CompositeWorkflowInputBinding[];
  paramsSnapshot?: { inputs: CompositeWorkflowParamBrief[]; outputs: CompositeWorkflowParamBrief[] };
}

/** 保存载荷中的逻辑节点。 */
export type CompositeWorkflowLogicNodePayload =
  | { id: string; kind: "loop"; config: CompositeWorkflowLoopConfig }
  | { id: string; kind: "branch"; config: CompositeWorkflowBranchConfig }
  | { id: string; kind: "transform"; config: CompositeWorkflowTransformConfig }
  | { id: string; kind: "switch"; config: CompositeWorkflowSwitchConfig };

/** 保存载荷中的起止节点。 */
export type CompositeWorkflowEndpointNodePayload =
  | { id: string; kind: "start"; label: string; outputParameters: Array<{ id: string; name: string; type: string }> }
  | {
      id: string;
      kind: "end";
      label: string;
      inputParameters: Array<{ id: string; name: string; type: string }>;
      inputBindings: CompositeWorkflowInputBinding[];
    };

/** 循环出口：循环体或结束后。 */
export type CompositeWorkflowLoopOutlet = "body" | "done";

/** 保存载荷边。 */
export interface CompositeWorkflowEdgePayload {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  branch?: "true" | "false";
  /** Switch 出口：case.id 或 "default"。 */
  switchOutlet?: string;
  /** 循环出口：body / done。 */
  loopOutlet?: CompositeWorkflowLoopOutlet;
}

/** 编排工作流保存载荷（P0 console / 未来 API）。 */
export interface CompositeWorkflowSavePayload {
  schemaVersion: 1;
  meta: {
    displayName: string;
    functionApi: string;
    version: string;
    ontologySpaceId: number;
    savedAt: string;
  };
  graph: {
    logicFlow: unknown;
  };
  nodes: Array<CompositeWorkflowFunctionNodePayload | CompositeWorkflowLogicNodePayload | CompositeWorkflowEndpointNodePayload>;
  edges: CompositeWorkflowEdgePayload[];
}

/** 侧栏拖入画布的数据载荷。 */
export type CompositeWorkflowDndPayload =
  | { nodeKind: "loop" | "branch" | "transform" | "switch" | "start" | "end" }
  | { nodeKind: "function"; functionApi: string; version: string; displayName: string };

/** 拖拽 MIME。 */
export const COMPOSITE_WORKFLOW_DND_MIME = "application/x-composite-workflow-node";
