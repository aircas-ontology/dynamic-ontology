/** 参数摘要（详情缓存）。 */
export interface CompositeWorkflowParamBrief {
  paramName: string;
  paramType: string;
  /** 对象或列表的下级属性；无下级时省略。 */
  fields?: CompositeWorkflowParamBrief[];
}

/** 函数节点入参绑定：手填或取自唯一前驱输出。 */
export type CompositeWorkflowInputBinding =
  { mode: "manual"; paramName: string; value: string } | { mode: "fromUpstream"; paramName: string; upstreamParamName: string };

/** 循环节点配置。 */
export interface CompositeWorkflowLoopConfig {
  kind: "loop";
  collection: { mode: "fromUpstream"; upstreamParamName: string } | { mode: "manual"; jsonText: string };
  itemParamName: string;
  maxIterations?: number;
}

/** 条件分支比较运算符。 */
export type CompositeWorkflowBranchOperator = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "truthy";

/** 条件分支节点配置。 */
export interface CompositeWorkflowBranchConfig {
  kind: "branch";
  left: { mode: "fromUpstream"; upstreamParamName: string } | { mode: "manual"; value: string };
  operator: CompositeWorkflowBranchOperator;
  right?: { mode: "manual"; value: string };
}

/** 数据格式转换节点配置。 */
export interface CompositeWorkflowTransformConfig {
  kind: "transform";
  language: "javascript";
  code: string;
  outputKeys: string[];
}

/** 画布节点业务 kind。 */
export type CompositeWorkflowNodeKind = "function" | "loop" | "branch" | "transform";

/** 保存载荷中的函数节点。 */
export interface CompositeWorkflowFunctionNodePayload {
  id: string;
  kind: "function";
  functionApi: string;
  version: string;
  displayName: string;
  inputBindings: CompositeWorkflowInputBinding[];
  paramsSnapshot?: { inputs: CompositeWorkflowParamBrief[]; outputs: CompositeWorkflowParamBrief[] };
}

/** 保存载荷中的逻辑节点。 */
export type CompositeWorkflowLogicNodePayload =
  | { id: string; kind: "loop"; config: CompositeWorkflowLoopConfig }
  | { id: string; kind: "branch"; config: CompositeWorkflowBranchConfig }
  | { id: string; kind: "transform"; config: CompositeWorkflowTransformConfig };

/** 保存载荷边。 */
export interface CompositeWorkflowEdgePayload {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  branch?: "true" | "false";
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
  nodes: Array<CompositeWorkflowFunctionNodePayload | CompositeWorkflowLogicNodePayload>;
  edges: CompositeWorkflowEdgePayload[];
}

/** 侧栏拖入画布的数据载荷。 */
export type CompositeWorkflowDndPayload =
  { nodeKind: "loop" | "branch" | "transform" } | { nodeKind: "function"; functionApi: string; version: string; displayName: string };

/** 拖拽 MIME。 */
export const COMPOSITE_WORKFLOW_DND_MIME = "application/x-composite-workflow-node";
