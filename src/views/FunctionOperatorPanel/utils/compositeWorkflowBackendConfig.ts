import type {
  CompositeWorkflowBranchOperator,
  CompositeWorkflowInputBinding,
  CompositeWorkflowNodeKind,
  OntologyCompositeConfig,
  OntologyCompositeEdge,
  OntologyCompositeNode,
} from "@/types";

import type { CompositeWorkflowGraphEdge, CompositeWorkflowGraphNodeSummary } from "./compositeWorkflowGraph.ts";
import { normalizeCompositeWorkflowLoopConfig } from "./compositeWorkflowLoopDefaults.ts";

/** LogicFlow 节点 type 常量；与 registerCompositeWorkflowNodes 保持一致，独立定义避免测试引入 LogicFlow。 */
const LF_NODE_TYPES: Record<CompositeWorkflowNodeKind, string> = {
  function: "composite-function",
  loop: "composite-loop",
  branch: "composite-branch",
  transform: "composite-transform",
  switch: "composite-switch",
  start: "composite-start",
  end: "composite-end",
};

/** 分支比较运算符到后端 Groovy 表达式运算符的映射。 */
const BRANCH_OPERATORS: Record<CompositeWorkflowBranchOperator, string> = {
  eq: "==",
  ne: "!=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
};

/** 详情参数类型到后端画布类型的映射（与 refs 解析端口类型的口径一致）。 */
const PARAM_TYPE_TO_CANVAS: Record<string, string> = {
  string: "string",
  number: "number",
  integer: "number",
  int: "number",
  long: "number",
  float: "number",
  double: "number",
  short: "number",
  byte: "number",
  char: "string",
  bool: "boolean",
  boolean: "boolean",
  list: "array",
  array: "array",
  object: "object",
};

/**
 * @description 解析函数节点出参端口在画布侧的类型；优先取 paramsSnapshot 里 result 出参的详情类型，缺省 object。
 * @param node 函数节点摘要。
 * @returns 画布类型字符串。
 */
function resolveCompositeWorkflowResultCanvasType(node: CompositeWorkflowGraphNodeSummary): string {
  const outputs = node.paramsSnapshot?.outputs ?? [];
  const resultPort = outputs.find((item) => item.paramName === "result");
  if (!resultPort || !resultPort.paramType) {
    return "object";
  }
  return PARAM_TYPE_TO_CANVAS[resultPort.paramType.trim().toLowerCase()] ?? "object";
}

/** 后端控制流端口名。 */
const FLOW_OUT = "__flow_out__";
const FLOW_IN = "__flow_in__";

/**
 * @description 将画布边的分支 / Switch / 循环出口映射为后端控制边 sourceParameterId。
 * @param edge 画布节点级连线。
 * @returns 控制流源端口名。
 */
function resolveControlFlowSourceParameterId(edge: CompositeWorkflowGraphEdge): string {
  if (edge.branch === "true" || edge.branch === "false") {
    return edge.branch;
  }
  const switchOutlet = typeof edge.switchOutlet === "string" ? edge.switchOutlet.trim() : "";
  if (switchOutlet) {
    return switchOutlet;
  }
  if (edge.loopOutlet === "body" || edge.loopOutlet === "done") {
    return edge.loopOutlet;
  }
  return FLOW_OUT;
}

/**
 * @description 由后端控制边 sourceParameterId 还原画布边 properties。
 * @param sourceParameterId 控制流源端口名。
 * @returns LogicFlow 边 properties。
 */
function restoreControlFlowEdgeProperties(sourceParameterId: string): Record<string, unknown> {
  if (sourceParameterId === "true" || sourceParameterId === "false") {
    return { branch: sourceParameterId };
  }
  if (sourceParameterId === "body" || sourceParameterId === "done") {
    return { loopOutlet: sourceParameterId };
  }
  if (sourceParameterId && sourceParameterId !== FLOW_OUT) {
    return { switchOutlet: sourceParameterId };
  }
  return {};
}

/**
 * @description 编译画布图为后端 compositeConfig 契约（保存载荷）。
 * @param options 编译选项。
 * @param options.nodes 画布节点摘要。
 * @param options.edges 画布节点级连线。
 * @param options.logicFlowGraph LogicFlow 原始图（getGraphRawData），原样透传给后端用于回显。
 * @returns 后端 compositeConfig。
 */
export function compileCompositeWorkflowToBackendConfig(options: {
  nodes: CompositeWorkflowGraphNodeSummary[];
  edges: CompositeWorkflowGraphEdge[];
  logicFlowGraph: unknown;
}): OntologyCompositeConfig {
  const { nodes, edges } = options;
  const nodesWithOutgoing = new Set(edges.map((edge) => edge.sourceNodeId));

  const backendNodes: OntologyCompositeNode[] = nodes.map((node) => {
    if (node.kind === "start") {
      return {
        id: node.id,
        kind: "start",
        label: "开始",
        outputParameters: node.outputParameters ?? [],
      };
    }
    if (node.kind === "end") {
      return {
        id: node.id,
        kind: "end",
        label: "结束",
        inputParameters: node.inputParameters ?? [],
      };
    }
    if (node.kind === "loop") {
      const config = node.loopConfig;
      // collection 取自上游时按 foreach 编译（collectionPath 记上游出参名）；手填集合时按固定次数 times。
      const collection = config?.collection;
      const isForeach = collection?.mode === "fromUpstream" && collection.upstreamParamName?.trim();
      const itemName = config?.itemParamName?.trim() || "item";
      const itemType = config?.itemType;
      const doneType = config?.doneType;
      return {
        id: node.id,
        kind: "loop",
        loopConfig: isForeach
          ? {
              mode: "foreach" as const,
              collectionPath: collection?.upstreamParamName?.trim(),
              itemName,
              ...(itemType ? { itemType } : {}),
              ...(doneType ? { doneType } : {}),
            }
          : {
              mode: "times" as const,
              times: typeof config?.maxIterations === "number" && config.maxIterations > 0 ? config.maxIterations : 1,
              itemName,
              ...(itemType ? { itemType } : {}),
              ...(doneType ? { doneType } : {}),
            },
      };
    }
    if (node.kind === "branch") {
      const rawExpression = node.branchConfig?.rawExpression;
      return {
        id: node.id,
        kind: "branch",
        branchConfig: {
          // 回显兜底保留的后端原表达式优先（operator/right 翻译不可逆）；用户重新配置后走翻译路径。
          expression:
            typeof rawExpression === "string" && rawExpression.trim()
              ? rawExpression.trim()
              : buildCompositeWorkflowBranchExpression(node.branchConfig?.operator, node.branchConfig?.right?.value),
        },
      };
    }
    if (node.kind === "transform") {
      const config = node.transformConfig;
      const mappingMode = config?.mappingMode === "json" ? "json" : "script";
      return {
        id: node.id,
        kind: "transform",
        transformConfig: {
          mappingMode,
          mappings: mappingMode === "json" ? config?.mappings : undefined,
          language: mappingMode === "script" ? config?.language || "typescript" : undefined,
          script: mappingMode === "script" ? (config?.code ?? "") : undefined,
        },
      };
    }
    if (node.kind === "switch") {
      const config = node.switchConfig;
      return {
        id: node.id,
        kind: "switch",
        switchConfig: {
          switchOnPath: config?.switchOn?.upstreamParamName?.trim() || "",
          cases: (config?.cases ?? []).map((item) => ({ id: item.id, value: item.value })),
        },
      };
    }
    return {
      id: node.id,
      kind: "function",
      functionId: node.functionApi ?? "",
      functionVersion: node.version ?? "",
      label: node.displayName ?? "",
      inputDefaults: buildCompositeWorkflowInputDefaults(node.inputBindings),
    };
  });

  const backendEdges: OntologyCompositeEdge[] = [];
  for (const edge of edges) {
    backendEdges.push({
      id: edge.id,
      sourceNodeId: edge.sourceNodeId,
      sourceParameterId: resolveControlFlowSourceParameterId(edge),
      targetNodeId: edge.targetNodeId,
      targetParameterId: FLOW_IN,
    });
    appendUpstreamDataEdges(backendEdges, nodes, edges, edge.targetNodeId);
  }

  // 优先从结束节点生成 outputMappings；没有结束节点时从尾部函数节点生成
  const endNode = nodes.find((node) => node.kind === "end");
  let outputMappings: Array<{ externalParameterId: string; nodeId: string; nodeParameterId: string }>;
  let outputParameters: Array<{ id: string; name: string; type: string }>;

  if (endNode && endNode.inputParameters && endNode.inputParameters.length > 0) {
    // 从结束节点的 inputParameters 生成 outputMappings
    outputMappings = endNode.inputParameters.map((param, index) => ({
      externalParameterId: param.id || (index === 0 ? "result" : `result_${index}`),
      nodeId: endNode.id,
      nodeParameterId: param.id || param.name,
    }));
    outputParameters = endNode.inputParameters.map((param, index) => ({
      id: param.id || (index === 0 ? "result" : `result_${index}`),
      name: param.name || param.id || (index === 0 ? "result" : `result_${index}`),
      type: param.type || "object",
    }));
  } else {
    // 兼容旧逻辑：从尾部函数节点生成
    const tailFunctionNodes = nodes.filter((node) => node.kind === "function" && !nodesWithOutgoing.has(node.id));
    const resolveOutputExternalId = (_node: CompositeWorkflowGraphNodeSummary, index: number): string => (index === 0 ? "result" : `result_${index}`);
    outputMappings = tailFunctionNodes.map((node, index) => ({
      externalParameterId: resolveOutputExternalId(node, index),
      nodeId: node.id,
      nodeParameterId: "result",
    }));
    outputParameters = tailFunctionNodes.map((node, index) => ({
      id: resolveOutputExternalId(node, index),
      name: resolveOutputExternalId(node, index),
      type: resolveCompositeWorkflowResultCanvasType(node),
    }));
  }

  // 优先从开始节点生成 inputMappings；没有开始节点时为空
  const startNode = nodes.find((node) => node.kind === "start");
  let inputMappings: Array<{ externalParameterId: string; nodeId: string; nodeParameterId: string }> = [];
  let inputParameters: Array<{ id: string; name: string; type: string }> = [];

  if (startNode && startNode.outputParameters && startNode.outputParameters.length > 0) {
    // 从开始节点的 outputParameters 生成 inputMappings
    inputMappings = startNode.outputParameters.map((param, index) => ({
      externalParameterId: param.id || (index === 0 ? "input" : `input_${index}`),
      nodeId: startNode.id,
      nodeParameterId: param.id || param.name,
    }));
    inputParameters = startNode.outputParameters.map((param, index) => ({
      id: param.id || (index === 0 ? "input" : `input_${index}`),
      name: param.name || param.id || (index === 0 ? "input" : `input_${index}`),
      type: param.type || "object",
    }));
  }

  return {
    kind: "composite",
    nodes: backendNodes,
    edges: backendEdges,
    inputMappings,
    outputMappings,
    inputParameters,
    outputParameters,
    graph: options.logicFlowGraph ?? undefined,
  };
}

/**
 * @description 从画布节点生成后端 inputDefaults（手动绑定端口名到手填值）。
 * @param bindings 函数节点入参绑定列表。
 * @returns 端口名到手填值的映射。
 */
function buildCompositeWorkflowInputDefaults(bindings: CompositeWorkflowInputBinding[] | undefined): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const binding of bindings ?? []) {
    if (binding.mode === "manual") {
      defaults[binding.paramName] = binding.value;
    }
  }
  return defaults;
}

/**
 * @description 判断节点自身是否声明了该输出端口；分支 / Switch 仅透传上游出参，不声明数据端口。
 * @param node 节点摘要。
 * @param portName 端口/参数名。
 * @returns 自身是否声明该端口。
 */
function nodeDeclaresOutputPort(node: CompositeWorkflowGraphNodeSummary, portName: string): boolean {
  if (node.kind === "start" || node.kind === "function") {
    const outputs: Array<{ name?: string; paramName?: string }> =
      node.kind === "start" ? (node.outputParameters ?? []).map((item) => ({ name: item.name })) : (node.paramsSnapshot?.outputs ?? []).map((item) => ({ paramName: item.paramName }));
    return outputs.some((item) => (item.name ?? item.paramName) === portName);
  }
  if (node.kind === "branch" || node.kind === "switch") {
    return false;
  }
  // 循环会产出 item / done 并透传循环体产出，转换节点出参由脚本推导，均按自身声明处理。
  return true;
}

/**
 * @description 解析数据边的真实产出节点：绑定透传参数时，分支 / Switch 不是产出方，应回退到上游真实声明该端口的节点，否则后端会以“源节点不存在输出端口”拒收。
 * @param nodes 画布节点摘要。
 * @param edges 画布节点级连线。
 * @param incomingSourceNodeId 目标节点入边起点。
 * @param portName 上游参数名。
 * @returns 数据边起点节点 id。
 */
function resolveDataEdgeSourceNodeId(
  nodes: CompositeWorkflowGraphNodeSummary[],
  edges: CompositeWorkflowGraphEdge[],
  incomingSourceNodeId: string,
  portName: string,
): string {
  let current = incomingSourceNodeId;
  const visited = new Set<string>([current]);
  for (let depth = 0; depth < 20; depth += 1) {
    const node = nodes.find((item) => item.id === current);
    if (!node || nodeDeclaresOutputPort(node, portName)) {
      return current;
    }
    const incoming = edges.find((edge) => edge.targetNodeId === current);
    if (!incoming || visited.has(incoming.sourceNodeId)) {
      return current;
    }
    visited.add(incoming.sourceNodeId);
    current = incoming.sourceNodeId;
  }
  return current;
}

/**
 * @description 按目标节点把 fromUpstream 绑定编译为数据边；前驱从画布连线第一条入边取。
 * @param backendEdges 输出边集合（就地追加）。
 * @param nodes 画布节点摘要。
 * @param edges 画布节点级连线。
 * @param targetNodeId 目标节点 id。
 */
function appendUpstreamDataEdges(
  backendEdges: OntologyCompositeEdge[],
  nodes: CompositeWorkflowGraphNodeSummary[],
  edges: CompositeWorkflowGraphEdge[],
  targetNodeId: string,
): void {
  const target = nodes.find((node) => node.id === targetNodeId);
  if (!target) {
    return;
  }
  const incoming = edges.find((edge) => edge.targetNodeId === targetNodeId);
  if (!incoming) {
    return;
  }
  const appendBindingEdges = (bindings: CompositeWorkflowInputBinding[] | undefined, portPrefix: string | undefined): void => {
    for (const binding of bindings ?? []) {
      if (binding.mode !== "fromUpstream") {
        continue;
      }
      const upstreamRoot = binding.upstreamParamPath[0];
      if (!upstreamRoot) {
        continue;
      }
      backendEdges.push({
        sourceNodeId: resolveDataEdgeSourceNodeId(nodes, edges, incoming.sourceNodeId, upstreamRoot),
        sourceParameterId: upstreamRoot,
        targetNodeId,
        targetParameterId: portPrefix ?? binding.paramName,
      });
    }
  };
  if (target.kind === "function") {
    appendBindingEdges(target.inputBindings, undefined);
    return;
  }
  if (target.kind === "transform") {
    appendBindingEdges(target.transformConfig?.inputBindings, undefined);
    return;
  }
  if (target.kind === "loop") {
    const collection = target.loopConfig?.collection;
    if (collection?.mode === "fromUpstream" && collection.upstreamParamName) {
      backendEdges.push({
        sourceNodeId: resolveDataEdgeSourceNodeId(nodes, edges, incoming.sourceNodeId, collection.upstreamParamName),
        sourceParameterId: collection.upstreamParamName,
        targetNodeId,
        targetParameterId: "collection",
      });
    }
    return;
  }
  if (target.kind === "branch") {
    const left = target.branchConfig?.left;
    const leftRoot = left?.mode === "fromUpstream" ? left.upstreamParamPath[0] : undefined;
    if (left?.mode === "fromUpstream" && leftRoot) {
      backendEdges.push({
        sourceNodeId: resolveDataEdgeSourceNodeId(nodes, edges, incoming.sourceNodeId, leftRoot),
        sourceParameterId: leftRoot,
        targetNodeId,
        targetParameterId: "value",
      });
    }
    return;
  }
  if (target.kind === "switch") {
    const switchOn = target.switchConfig?.switchOn;
    const switchRoot = switchOn?.mode === "fromUpstream" ? switchOn.upstreamParamPath[0] || switchOn.upstreamParamName : undefined;
    if (switchOn?.mode === "fromUpstream" && switchRoot?.trim()) {
      backendEdges.push({
        sourceNodeId: resolveDataEdgeSourceNodeId(nodes, edges, incoming.sourceNodeId, switchRoot.trim()),
        sourceParameterId: switchRoot.trim(),
        targetNodeId,
        targetParameterId: switchRoot.trim(),
      });
    }
    return;
  }
  if (target.kind === "end") {
    appendBindingEdges(target.inputBindings, undefined);
  }
}

/**
 * @description 生成分支 Groovy 判断表达式；变量固定用分支入端口名 value。
 * @param operator 比较运算符。
 * @param rightValue 手填右值。
 * @returns 表达式字符串。
 */
function buildCompositeWorkflowBranchExpression(operator: CompositeWorkflowBranchOperator | undefined, rightValue: string | undefined): string {
  const op = BRANCH_OPERATORS[operator ?? "gt"];
  const rawRight = (rightValue ?? "").trim();
  const right = rawRight === "" || Number.isFinite(Number(rawRight)) ? (rawRight === "" ? "null" : rawRight) : JSON.stringify(rawRight);
  return `value ${op} ${right}`;
}

/** 回显用的 LogicFlow render 数据结构。 */
export interface CompositeWorkflowRestoreGraphData {
  nodes: Array<{ id: string; type: string; x: number; y: number; properties: Record<string, unknown> }>;
  edges: Array<{ id: string; type: string; sourceNodeId: string; targetNodeId: string; properties: Record<string, unknown> }>;
}

/**
 * @description 将详情/草稿中的 compositeConfig 规范为后端契约；兼容旧版前端 SavePayload（schemaVersion + graph.logicFlow）。
 * @param config 详情或草稿中的编排配置。
 * @returns 可回显的 OntologyCompositeConfig；无法识别时为 null。
 */
export function normalizeCompositeConfigForRestore(config: unknown): OntologyCompositeConfig | null {
  if (!config || typeof config !== "object") {
    return null;
  }
  const record = config as Record<string, unknown>;
  if (record.schemaVersion === 1 && record.graph && typeof record.graph === "object") {
    const logicFlow = (record.graph as { logicFlow?: unknown }).logicFlow;
    if (logicFlow && typeof logicFlow === "object") {
      return {
        nodes: [],
        edges: [],
        inputMappings: [],
        outputMappings: [],
        inputParameters: [],
        outputParameters: [],
        graph: logicFlow,
      };
    }
  }
  if (Array.isArray(record.nodes) || (record.graph && typeof record.graph === "object")) {
    return config as OntologyCompositeConfig;
  }
  return null;
}

/**
 * @description 把后端 compositeConfig 还原为 LogicFlow render 数据；优先使用透传的画布原始图，缺失时按 nodes/edges 兜底重建。
 * @param config 后端 compositeConfig；可空。
 * @returns LogicFlow render 数据。
 */
export function buildCompositeWorkflowRestoreGraphData(config: OntologyCompositeConfig | null | undefined): CompositeWorkflowRestoreGraphData {
  const normalized = normalizeCompositeConfigForRestore(config) ?? config ?? undefined;
  const graph = normalized?.graph;
  const graphNodes = graph && typeof graph === "object" ? (graph as { nodes?: unknown[] }).nodes : undefined;
  // graph 需为含非空 nodes 的结构才直接使用；残缺或空 graph（旧保存残留）回落到 nodes/edges 兜底重建。
  if (Array.isArray(graphNodes) && graphNodes.length > 0) {
    return graph as CompositeWorkflowRestoreGraphData;
  }
  const nodes = (normalized?.nodes ?? []).map((node, index) => {
    const kind = (node.kind ?? "function") as CompositeWorkflowNodeKind;
    const properties = buildCompositeWorkflowRestoreNodeProperties(node, normalized?.edges ?? []);
    let text = "";
    if (kind === "function") {
      const label = node.label?.trim() || node.functionId || "脚本函数";
      const versionText = node.functionVersion?.trim() ? `v${node.functionVersion.trim()}` : "v-";
      text = `${label}\n${node.functionId ?? ""} · ${versionText}`;
    } else {
      const titles: Record<string, string> = {
        loop: "循环",
        branch: "条件分支",
        transform: "数据格式转换",
        switch: "Switch Case",
        start: "开始",
        end: "结束",
      };
      text = titles[kind] ?? kind;
    }
    return {
      id: node.id,
      type: LF_NODE_TYPES[kind] ?? LF_NODE_TYPES.function,
      x: 120 + (index % 4) * 260,
      y: 120 + Math.floor(index / 4) * 160,
      text,
      properties,
    };
  });
  const pairKey = (sourceNodeId: string, targetNodeId: string): string => `${sourceNodeId}\u0001${targetNodeId}`;
  const restoredEdges: CompositeWorkflowRestoreGraphData["edges"] = [];
  const coveredPairs = new Set<string>();
  for (const edge of normalized?.edges ?? []) {
    if (edge.targetParameterId !== FLOW_IN) {
      continue;
    }
    coveredPairs.add(pairKey(edge.sourceNodeId, edge.targetNodeId));
    restoredEdges.push({
      id: edge.id ?? `restore_edge_${restoredEdges.length}`,
      type: "polyline",
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      properties: restoreControlFlowEdgeProperties(edge.sourceParameterId),
    });
  }
  // 旧数据可能只存数据边（无 __flow_in__ 控制边）：对未被控制边覆盖的节点对，用数据边补一条节点级连线，同一节点对去重。
  for (const edge of normalized?.edges ?? []) {
    if (edge.targetParameterId === FLOW_IN) {
      continue;
    }
    const key = pairKey(edge.sourceNodeId, edge.targetNodeId);
    if (coveredPairs.has(key)) {
      continue;
    }
    coveredPairs.add(key);
    restoredEdges.push({
      id: edge.id ?? `restore_edge_${restoredEdges.length}`,
      type: "polyline",
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      properties: {},
    });
  }
  return { nodes, edges: restoredEdges };
}

/**
 * @description 重建回显节点 properties：函数节点恢复 functionApi/显示名，inputDefaults 转手动绑定，
 * 数据边转 fromUpstream 绑定（保证回显后再保存能还原数据边）；逻辑节点恢复各自配置。
 * @param node 后端编排节点。
 * @param backendEdges 后端编排连线（含数据边与控制边）。
 * @returns LogicFlow 节点 properties。
 */
function buildCompositeWorkflowRestoreNodeProperties(node: OntologyCompositeNode, backendEdges: OntologyCompositeEdge[]): Record<string, unknown> {
  const dataEdgeTo = (targetParameterId: string): OntologyCompositeEdge | undefined =>
    backendEdges.find((edge) => edge.targetNodeId === node.id && edge.targetParameterId === targetParameterId);
  const toFromUpstreamBinding = (edge: OntologyCompositeEdge): CompositeWorkflowInputBinding => ({
    mode: "fromUpstream",
    paramName: edge.targetParameterId,
    paramPath: [edge.targetParameterId],
    upstreamParamName: edge.sourceParameterId,
    upstreamParamPath: [edge.sourceParameterId],
  });
  if (node.kind === "start") {
    return {
      kind: "start",
      label: node.label?.trim() || "开始",
      outputParameters: node.outputParameters ?? [],
    };
  }
  if (node.kind === "end") {
    const inputBindings: CompositeWorkflowInputBinding[] = backendEdges
      .filter((edge) => edge.targetNodeId === node.id && edge.targetParameterId !== FLOW_IN && Boolean(edge.targetParameterId))
      .map(toFromUpstreamBinding);
    return {
      kind: "end",
      label: node.label?.trim() || "结束",
      inputParameters: node.inputParameters ?? [],
      inputBindings,
    };
  }
  if (node.kind === "loop") {
    // foreach 模式的 collection 数据边还原为"取自上游"；无数据边时按固定次数（times）模式。
    const collectionEdge = dataEdgeTo("collection");
    return {
      kind: "loop",
      loopConfig: normalizeCompositeWorkflowLoopConfig({
        kind: "loop",
        collection: collectionEdge ? { mode: "fromUpstream", upstreamParamName: collectionEdge.sourceParameterId } : { mode: "manual", jsonText: "[]" },
        itemParamName: node.loopConfig?.itemName ?? "item",
        itemType: node.loopConfig?.itemType,
        doneType: node.loopConfig?.doneType,
        maxIterations: node.loopConfig?.times ?? 1,
      }),
    };
  }
  if (node.kind === "branch") {
    // 左值从 value 数据边还原真实上游出参名；运算符/右值不可从表达式反推，保留原表达式供保存时原样回传。
    const valueEdge = dataEdgeTo("value");
    return {
      kind: "branch",
      branchConfig: {
        kind: "branch",
        left: valueEdge
          ? { mode: "fromUpstream", upstreamParamName: valueEdge.sourceParameterId, upstreamParamPath: [valueEdge.sourceParameterId] }
          : { mode: "fromUpstream", upstreamParamName: "value", upstreamParamPath: ["value"] },
        operator: "gt",
        right: { mode: "manual", value: "" },
        rawExpression: node.branchConfig?.expression ?? "",
      },
    };
  }
  if (node.kind === "switch") {
    const switchOnPath = node.switchConfig?.switchOnPath?.trim() || "value";
    const switchOnEdge = dataEdgeTo(switchOnPath) ?? dataEdgeTo("value");
    const upstreamName = switchOnEdge?.sourceParameterId?.trim() || switchOnPath;
    return {
      kind: "switch",
      switchConfig: {
        kind: "switch",
        switchOn: { mode: "fromUpstream", upstreamParamName: upstreamName, upstreamParamPath: [upstreamName] },
        cases: (node.switchConfig?.cases ?? []).map((item) => ({ id: item.id, value: item.value })),
      },
    };
  }
  if (node.kind === "transform") {
    const inputBindings: CompositeWorkflowInputBinding[] = backendEdges
      .filter((edge) => edge.targetNodeId === node.id && edge.targetParameterId !== FLOW_IN && Boolean(edge.targetParameterId))
      .map(toFromUpstreamBinding);
    const mappingMode = node.transformConfig?.mappingMode === "json" ? "json" : "script";
    return {
      kind: "transform",
      transformConfig: {
        kind: "transform",
        mappingMode,
        mappings: node.transformConfig?.mappings,
        language: (node.transformConfig?.language as "typescript" | "groovy" | "javascript") ?? "typescript",
        code: node.transformConfig?.script ?? "",
        inputBindings,
      },
    };
  }
  const inputBindings: CompositeWorkflowInputBinding[] = [];
  for (const edge of backendEdges) {
    if (edge.targetNodeId !== node.id || edge.targetParameterId === FLOW_IN || !edge.targetParameterId) {
      continue;
    }
    inputBindings.push(toFromUpstreamBinding(edge));
  }
  for (const [paramName, value] of Object.entries(node.inputDefaults ?? {})) {
    inputBindings.push({
      mode: "manual",
      paramName,
      paramPath: [paramName],
      value: typeof value === "string" ? value : String(value),
    });
  }
  return {
    kind: "function",
    functionApi: node.functionId ?? "",
    version: node.functionVersion ?? "",
    displayName: node.label ?? "",
    inputBindings,
  };
}
