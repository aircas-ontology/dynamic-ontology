import type {
  CompositeWorkflowBranchOperator,
  CompositeWorkflowInputBinding,
  CompositeWorkflowNodeKind,
  OntologyCompositeConfig,
  OntologyCompositeEdge,
  OntologyCompositeNode,
} from "@/types";

import type { CompositeWorkflowGraphEdge, CompositeWorkflowGraphNodeSummary } from "./compositeWorkflowGraph.ts";
import { collectCompositeWorkflowLoopBodyOutputs } from "./compositeWorkflowGraph.ts";
import { normalizeCompositeWorkflowLoopConfig } from "./compositeWorkflowLoopDefaults.ts";
import { resolveCompositeWorkflowTransformOutputs } from "./compositeWorkflowTransformDefaults.ts";

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

/** Groovy 运算符到分支比较运算符的反查表，用于回显时还原手填右值。 */
const BRANCH_OPERATOR_SYMBOLS: Record<string, CompositeWorkflowBranchOperator> = {
  "==": "eq",
  "!=": "ne",
  ">": "gt",
  ">=": "gte",
  "<": "lt",
  "<=": "lte",
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

/** 循环节点"结束后"出口产出的结果端口名，与运行期 loop 节点的 done 出参一致。 */
const DONE_PORT = "done";

/** 函数节点固定的输出端口名；未加载详情时出参未知，按此端口取函数结果。 */
const FUNCTION_RESULT_PORT = "result";

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
        inputDefaults: buildCompositeWorkflowInputDefaults(node.inputBindings),
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
        inputDefaults: buildCompositeWorkflowInputDefaults(config?.inputBindings),
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
  const boundTargetNodeIds = new Set<string>();
  for (const edge of edges) {
    backendEdges.push({
      id: edge.id,
      sourceNodeId: edge.sourceNodeId,
      sourceParameterId: resolveControlFlowSourceParameterId(edge),
      targetNodeId: edge.targetNodeId,
      targetParameterId: FLOW_IN,
    });
    // 同一目标节点的多条入边只解一次数据绑定，避免重复生成数据边。
    if (boundTargetNodeIds.has(edge.targetNodeId)) {
      continue;
    }
    boundTargetNodeIds.add(edge.targetNodeId);
    appendUpstreamDataEdges(backendEdges, nodes, edges, edge.targetNodeId);
  }

  // 优先从结束节点生成 outputMappings；没有结束节点时从尾部函数节点生成
  // 允许多个结束节点，各结束节点的入参按出现顺序合并为编排出参（同名/同 id 只保留一次）
  const endNodes = nodes.filter((node) => node.kind === "end");
  const endNodesWithParams = endNodes.filter((node) => (node.inputParameters ?? []).length > 0);
  let outputMappings: Array<{ externalParameterId: string; nodeId: string; nodeParameterId: string }>;
  let outputParameters: Array<{ id: string; name: string; type: string }>;

  if (endNodesWithParams.length > 0) {
    outputMappings = [];
    const declared: Array<{ id: string; name: string; type: string }> = [];
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    let paramCount = 0;
    for (const currentEnd of endNodesWithParams) {
      for (const param of currentEnd.inputParameters ?? []) {
        const fallback = paramCount === 0 ? "result" : `result_${paramCount}`;
        const externalParameterId = param.id || fallback;
        const name = param.name || param.id || fallback;
        const type = param.type || "object";
        paramCount += 1;
        outputMappings.push({ externalParameterId, nodeId: currentEnd.id, nodeParameterId: param.id || param.name || fallback });
        if (seenIds.has(externalParameterId) || seenNames.has(name)) {
          // 同名出参被多个结束节点复用：类型不一致时按不限定类型声明（后端把 object 当通配），
          // 否则多支路结束节点会因为出参类型冲突而无法保存。
          const existing = declared.find((item) => item.id === externalParameterId);
          if (existing && existing.type !== type) {
            existing.type = "object";
          }
          continue;
        }
        seenIds.add(externalParameterId);
        seenNames.add(name);
        declared.push({ id: externalParameterId, name, type });
      }
    }
    outputParameters = declared;
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
  const incoming = edges.filter((edge) => edge.targetNodeId === targetNodeId);
  if (incoming.length === 0) {
    return;
  }
  const feederOf = (upstreamRoot: string): string =>
    resolveCompositeWorkflowDataFeeder({ targetNodeId, upstreamRoot, nodes, edges });
  const appendBindingEdges = (bindings: CompositeWorkflowInputBinding[] | undefined, portPrefix: string | undefined): void => {
    for (const binding of bindings ?? []) {
      if (binding.mode !== "fromUpstream") {
        continue;
      }
      const upstreamRoot = binding.upstreamParamPath[0];
      if (!upstreamRoot) {
        continue;
      }
      // 找不到产出该出参的数据源时不连线：绑到分支 / 循环这类控制节点上会让后端校验失败。
      const sourceNodeId = feederOf(upstreamRoot);
      if (!sourceNodeId) {
        continue;
      }
      backendEdges.push({
        sourceNodeId,
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
    const collectionRoot = collection?.mode === "fromUpstream" ? collection.upstreamParamName?.trim() : "";
    const collectionFeeder = collectionRoot ? feederOf(collectionRoot) : "";
    if (collectionRoot && collectionFeeder) {
      backendEdges.push({
        sourceNodeId: collectionFeeder,
        sourceParameterId: collectionRoot,
        targetNodeId,
        targetParameterId: "collection",
      });
    }
    return;
  }
  if (target.kind === "branch") {
    const left = target.branchConfig?.left;
    const leftRoot = left?.mode === "fromUpstream" ? left.upstreamParamPath[0]?.trim() : "";
    const leftFeeder = leftRoot ? feederOf(leftRoot) : "";
    if (leftRoot && leftFeeder) {
      backendEdges.push({
        sourceNodeId: leftFeeder,
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
    const switchFeeder = switchRoot?.trim() ? feederOf(switchRoot.trim()) : "";
    if (switchRoot?.trim() && switchFeeder) {
      backendEdges.push({
        sourceNodeId: switchFeeder,
        sourceParameterId: switchRoot.trim(),
        targetNodeId,
        targetParameterId: switchRoot.trim(),
      });
    }
    return;
  }
  if (target.kind === "end") {
    appendBindingEdges(resolveCompositeWorkflowEndBindings(target, nodes, edges, feederOf), undefined);
  }
}

/**
 * @description 结束节点未配置出参绑定时兜底绑最近上游出参。
 * 新建的结束节点默认没有绑定，而结束节点的入参就是编排出参，不兜底会让编排永远吐不出结果。
 * @param node 结束节点摘要。
 * @param nodes 画布节点摘要。
 * @param edges 画布节点级连线。
 * @param feederOf 出参名到产出节点的解析函数。
 * @returns 结束节点出参绑定。
 */
function resolveCompositeWorkflowEndBindings(
  node: CompositeWorkflowGraphNodeSummary,
  nodes: CompositeWorkflowGraphNodeSummary[],
  edges: CompositeWorkflowGraphEdge[],
  feederOf: (upstreamRoot: string) => string,
): CompositeWorkflowInputBinding[] {
  const bindings = node.inputBindings ?? [];
  if (bindings.length > 0 || (node.inputParameters ?? []).length === 0) {
    return bindings;
  }
  return (node.inputParameters ?? []).map((param): CompositeWorkflowInputBinding => {
    const paramName = param.name?.trim() || param.id;
    const upstreamParamName = resolveNearestCompositeWorkflowUpstreamOutputName({
      targetNodeId: node.id,
      preferredName: paramName,
      nodes,
      edges,
    });
    if (!upstreamParamName || !feederOf(upstreamParamName)) {
      return { mode: "manual", paramName, paramPath: [paramName], value: "" };
    }
    return {
      mode: "fromUpstream",
      paramName,
      paramPath: [paramName],
      upstreamParamName,
      upstreamParamPath: [upstreamParamName],
    };
  });
}

/**
 * 上游出参的产出节点。paramName 为 null 表示节点未声明出参（详情快照缺失），按"可能产出任意出参"处理；
 * hops 为回溯途中跨越的数据产出节点层数，越小越靠近目标。
 */
interface CompositeWorkflowOutputOwner {
  nodeId: string;
  paramName: string | null;
  hops: number;
}

/**
 * @description 沿入边向上收集真实的出参产出节点：分支 / Switch / 循环 done 出口只做控制流继续上溯，
 * 产出数据的节点既登记出参、也继续上溯（画布可能把更上游的出参直接绑到下游）。
 * @param nodes 画布节点摘要。
 * @param edges 画布节点级连线。
 * @param nodeId 当前回溯节点 id。
 * @param hops 已跨越的数据产出节点层数。
 * @param visited 已回溯节点，防止成环。
 * @param owners 输出集合（就地追加）。
 */
function collectCompositeWorkflowUpstreamOutputOwners(
  nodes: CompositeWorkflowGraphNodeSummary[],
  edges: CompositeWorkflowGraphEdge[],
  nodeId: string,
  hops: number,
  visited: Set<string>,
  owners: CompositeWorkflowOutputOwner[],
): void {
  if (visited.has(nodeId)) {
    return;
  }
  visited.add(nodeId);
  for (const edge of edges) {
    if (edge.targetNodeId !== nodeId) {
      continue;
    }
    const source = nodes.find((node) => node.id === edge.sourceNodeId);
    if (!source) {
      continue;
    }
    if (source.kind === "branch" || source.kind === "switch") {
      collectCompositeWorkflowUpstreamOutputOwners(nodes, edges, source.id, hops, visited, owners);
      continue;
    }
    if (source.kind === "loop") {
      if (edge.loopOutlet === "body") {
        // 循环体优先取当前元素；同时也上溯循环外的出参，画布上允许把循环外的输出直接绑给体内节点。
        owners.push({ nodeId: source.id, paramName: source.loopConfig?.itemParamName?.trim() || "item", hops });
      } else if (edge.loopOutlet === DONE_PORT) {
        // 循环结束出口产出本次循环的结果（done）。
        owners.push({ nodeId: source.id, paramName: DONE_PORT, hops });
        // 结束后还能取循环体内部节点的产出：留在上下文里的是最后一轮的值
        for (const bodyOutput of collectCompositeWorkflowLoopBodyOutputs(nodes, edges, source.id)) {
          owners.push({ nodeId: bodyOutput.nodeId, paramName: bodyOutput.paramName, hops: hops + 1 });
        }
      }
      collectCompositeWorkflowUpstreamOutputOwners(nodes, edges, source.id, hops, visited, owners);
      continue;
    }
    const outputs: Array<{ paramName: string }> =
      source.kind === "start"
        ? (source.outputParameters ?? []).map((param) => ({ paramName: param.name }))
        : source.kind === "transform"
          ? resolveCompositeWorkflowTransformOutputs(source.transformConfig)
          : (source.paramsSnapshot?.outputs ?? []);
    if (outputs.length > 0) {
      for (const output of outputs) {
        owners.push({ nodeId: source.id, paramName: output.paramName, hops });
      }
    } else {
      // 回显打开旧编排时函数节点可能还没拉取详情：此时出参未知，登记为通配源而不是让下游绑定到控制节点上。
      owners.push({ nodeId: source.id, paramName: null, hops });
    }
    collectCompositeWorkflowUpstreamOutputOwners(nodes, edges, source.id, hops + 1, visited, owners);
  }
}

/**
 * @description 定位真正产出某出参的上游节点；同名出参取离目标最近的一个，找不到时回落到直接前驱。
 * @param options.targetNodeId 目标节点 id。
 * @param options.upstreamRoot 上游出参名。
 * @param options.nodes 画布节点摘要。
 * @param options.edges 画布节点级连线。
 * @returns 数据边源节点 id；找不到产出该出参的数据源时返回空串。
 */
function resolveCompositeWorkflowDataFeeder(options: {
  targetNodeId: string;
  upstreamRoot: string;
  nodes: CompositeWorkflowGraphNodeSummary[];
  edges: CompositeWorkflowGraphEdge[];
}): string {
  const owners: CompositeWorkflowOutputOwner[] = [];
  collectCompositeWorkflowUpstreamOutputOwners(options.nodes, options.edges, options.targetNodeId, 0, new Set<string>(), owners);
  // 先取同名出参里最近的一个；都没有时退到最近"出参未知"的节点，避免把控制节点当成数据源。
  let exact: CompositeWorkflowOutputOwner | undefined;
  let wildcard: CompositeWorkflowOutputOwner | undefined;
  for (const owner of owners) {
    if (owner.paramName === options.upstreamRoot) {
      if (!exact || owner.hops < exact.hops) {
        exact = owner;
      }
    } else if (owner.paramName === null && (!wildcard || owner.hops < wildcard.hops)) {
      wildcard = owner;
    }
  }
  return (exact ?? wildcard)?.nodeId ?? "";
}

/**
 * @description 取离目标最近的上游出参名，优先与期望参数名同名。
 * 未加载详情的函数节点出参未知，此时按其固定的 result 出参兜底。
 * @param options.targetNodeId 目标节点 id。
 * @param options.preferredName 期望的出参名。
 * @param options.nodes 画布节点摘要。
 * @param options.edges 画布节点级连线。
 * @returns 上游出参名；无可用上游出参时返回空串。
 */
function resolveNearestCompositeWorkflowUpstreamOutputName(options: {
  targetNodeId: string;
  preferredName: string;
  nodes: CompositeWorkflowGraphNodeSummary[];
  edges: CompositeWorkflowGraphEdge[];
}): string {
  const owners: CompositeWorkflowOutputOwner[] = [];
  collectCompositeWorkflowUpstreamOutputOwners(options.nodes, options.edges, options.targetNodeId, 0, new Set<string>(), owners);
  const named = owners.filter((owner): owner is CompositeWorkflowOutputOwner & { paramName: string } => owner.paramName !== null);
  const preferred = named.find((owner) => owner.paramName === options.preferredName);
  if (preferred) {
    return preferred.paramName;
  }
  if (named.length > 0) {
    return named.reduce((best, owner) => (owner.hops < best.hops ? owner : best)).paramName;
  }
  const wildcard = owners.find((owner) => owner.paramName === null);
  const wildcardNode = wildcard ? options.nodes.find((node) => node.id === wildcard.nodeId) : undefined;
  return wildcardNode?.kind === "function" ? FUNCTION_RESULT_PORT : "";
}

/**
 * @description 从后端分支表达式反解运算符与手填右值；无法识别时退到大于 + 空右值。
 * @param expression 后端 Groovy 判断表达式。
 * @returns 运算符与右值。
 */
function parseCompositeWorkflowBranchExpression(expression: string | undefined): { operator: CompositeWorkflowBranchOperator; rightValue: string } {
  const matched = /^value\s*(==|!=|>=|<=|>|<)\s*(.*)$/.exec((expression ?? "").trim());
  if (!matched) {
    return { operator: "gt", rightValue: "" };
  }
  const operator = BRANCH_OPERATOR_SYMBOLS[matched[1] ?? ""] ?? "gt";
  const rawRight = (matched[2] ?? "").trim();
  if (!rawRight || rawRight === "null") {
    return { operator, rightValue: "" };
  }
  if (rawRight.startsWith('"')) {
    try {
      return { operator, rightValue: String(JSON.parse(rawRight)) };
    } catch {
      return { operator, rightValue: rawRight.replace(/^"|"$/g, "") };
    }
  }
  return { operator, rightValue: rawRight };
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
    return mergeCompositeWorkflowBackendNodeProperties(graph as CompositeWorkflowRestoreGraphData, normalized?.nodes ?? [], normalized?.edges ?? []);
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
  const controlTargets = new Set<string>();
  for (const edge of normalized?.edges ?? []) {
    if (edge.targetParameterId !== FLOW_IN) {
      continue;
    }
    coveredPairs.add(pairKey(edge.sourceNodeId, edge.targetNodeId));
    controlTargets.add(edge.targetNodeId);
    restoredEdges.push({
      id: edge.id ?? `restore_edge_${restoredEdges.length}`,
      type: "polyline",
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      properties: restoreControlFlowEdgeProperties(edge.sourceParameterId),
    });
  }
  // 旧数据可能只存数据边（无 __flow_in__ 控制边）：对完全没有控制入边的节点，用数据边补一条节点级连线，同一节点对去重。
  // 已有控制入边的节点不再补线，否则数据边的源节点（可能跨过控制节点）会被误当成另一条控制前驱。
  for (const edge of normalized?.edges ?? []) {
    if (edge.targetParameterId === FLOW_IN || controlTargets.has(edge.targetNodeId)) {
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
 * @description 用后端节点配置补齐画布原始图缺失的 properties（画布图本身的值优先保留）。
 * 画布图可能由接口/旧版本保存下来缺少 switchConfig 等配置，直接渲染会让用户以为配置丢失、
 * 再次保存又把空配置写回后端。
 * @param graphData 画布原始图。
 * @param backendNodes 后端编排节点。
 * @param backendEdges 后端编排连线。
 * @returns 补齐后的画布图。
 */
function mergeCompositeWorkflowBackendNodeProperties(
  graphData: CompositeWorkflowRestoreGraphData,
  backendNodes: OntologyCompositeNode[],
  backendEdges: OntologyCompositeEdge[],
): CompositeWorkflowRestoreGraphData {
  if (backendNodes.length === 0) {
    return graphData;
  }
  return {
    nodes: graphData.nodes.map((node) => {
      const backendNode = backendNodes.find((item) => item.id === node.id);
      if (!backendNode) {
        return node;
      }
      const backendProperties = buildCompositeWorkflowRestoreNodeProperties(backendNode, backendEdges);
      const properties: Record<string, unknown> = { ...backendProperties };
      for (const [key, value] of Object.entries(node.properties ?? {})) {
        if (value !== undefined) {
          properties[key] = value;
        }
      }
      return { ...node, properties };
    }),
    edges: graphData.edges,
  };
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
    // 左值从 value 数据边还原真实上游出参名；运算符与右值从后端表达式反解，避免回显后保存丢失判断条件。
    const valueEdge = dataEdgeTo("value");
    const parsed = parseCompositeWorkflowBranchExpression(node.branchConfig?.expression);
    return {
      kind: "branch",
      branchConfig: {
        kind: "branch",
        left: valueEdge
          ? { mode: "fromUpstream", upstreamParamName: valueEdge.sourceParameterId, upstreamParamPath: [valueEdge.sourceParameterId] }
          : { mode: "fromUpstream", upstreamParamName: "value", upstreamParamPath: ["value"] },
        operator: parsed.operator,
        right: { mode: "manual", value: parsed.rightValue },
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
