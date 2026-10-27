import type {
  CompositeWorkflowBranchConfig,
  CompositeWorkflowEdgePayload,
  CompositeWorkflowEndpointNodePayload,
  CompositeWorkflowFunctionNodePayload,
  CompositeWorkflowInputBinding,
  CompositeWorkflowLogicNodePayload,
  CompositeWorkflowLoopConfig,
  CompositeWorkflowNodeKind,
  CompositeWorkflowParamBrief,
  CompositeWorkflowSavePayload,
  CompositeWorkflowSwitchConfig,
  CompositeWorkflowTransformConfig,
  GetOntologyFunctionDetailParamItem,
} from "@/types";

import { createDefaultCompositeWorkflowBranchConfig, normalizeCompositeWorkflowBranchConfig } from "./compositeWorkflowBranchDefaults.ts";
import { createDefaultCompositeWorkflowLoopConfig, normalizeCompositeWorkflowLoopConfig } from "./compositeWorkflowLoopDefaults.ts";
import { compareCompositeWorkflowParamTypes } from "./compositeWorkflowParamType.ts";
import { createDefaultCompositeWorkflowSwitchConfig, normalizeCompositeWorkflowSwitchConfig } from "./compositeWorkflowSwitchDefaults.ts";
import { createDefaultCompositeWorkflowTransformConfig, resolveCompositeWorkflowTransformOutputs } from "./compositeWorkflowTransformDefaults.ts";

/** 图中用于校验的边。 */
export interface CompositeWorkflowGraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  branch?: "true" | "false";
  switchOutlet?: string;
  loopOutlet?: "body" | "done";
}

/** 图中用于校验的节点摘要。 */
export interface CompositeWorkflowGraphNodeSummary {
  id: string;
  kind: CompositeWorkflowNodeKind;
  functionApi?: string;
  version?: string;
  displayName?: string;
  inputBindings?: CompositeWorkflowInputBinding[];
  paramsSnapshot?: { inputs: CompositeWorkflowParamBrief[]; outputs: CompositeWorkflowParamBrief[] };
  loopConfig?: CompositeWorkflowLoopConfig;
  branchConfig?: CompositeWorkflowBranchConfig;
  transformConfig?: CompositeWorkflowTransformConfig;
  switchConfig?: CompositeWorkflowSwitchConfig;
  /** 开始节点的输出参数（即编排入参）。 */
  outputParameters?: Array<{ id: string; name: string; type: string }>;
  /** 结束节点的输入参数（即编排出参）。 */
  inputParameters?: Array<{ id: string; name: string; type: string }>;
}

/**
 * @description 将详情参数项递归转为编排参数摘要，不读取参数值。
 * @param item 详情参数项。
 * @returns 参数摘要。
 */
function mapDetailParamItemToCompositeBrief(item: GetOntologyFunctionDetailParamItem): CompositeWorkflowParamBrief {
  const brief: CompositeWorkflowParamBrief = {
    paramName: typeof item.paramName === "string" ? item.paramName.trim() : "",
    paramType: typeof item.paramType === "string" ? item.paramType : "",
  };
  if (Array.isArray(item.fields) && item.fields.length > 0) {
    brief.fields = [...item.fields]
      .sort((left, right) => (left.paramOrder ?? 0) - (right.paramOrder ?? 0))
      .map((child) => mapDetailParamItemToCompositeBrief(child))
      .filter((child) => child.paramName);
  }
  return brief;
}

/**
 * @description 从详情 params 取出指定方向的参数树。不检查另一方向是否已填写值。
 * @param params 详情参数列表。
 * @param category INPUT 或 OUTPUT。
 * @returns 参数摘要。
 */
export function mapCompositeWorkflowDetailParamBriefs(
  params: GetOntologyFunctionDetailParamItem[],
  category: "INPUT" | "OUTPUT",
): CompositeWorkflowParamBrief[] {
  const briefs: CompositeWorkflowParamBrief[] = [];
  const sorted = [...params].sort((left, right) => (left.paramOrder ?? 0) - (right.paramOrder ?? 0));
  for (const item of sorted) {
    const itemCategory = typeof item.category === "string" ? item.category.trim().toUpperCase() : "";
    if (itemCategory !== category) {
      continue;
    }
    const brief = mapDetailParamItemToCompositeBrief(item);
    if (brief.paramName) {
      briefs.push(brief);
    }
  }
  return briefs;
}

/**
 * @description 合并节点 paramsSnapshot 与详情 params：某一方向快照非空时保留快照，否则从详情按 category 补齐。避免空 `inputs: []` 挡住详情 INPUT。
 * @param snapshot 节点上已有参数快照；可为空。
 * @param detailParams 函数详情 params。
 * @returns 用于展示与绑定的 inputs / outputs。
 */
export function resolveCompositeWorkflowParamsFromSnapshotAndDetail(
  snapshot: { inputs?: CompositeWorkflowParamBrief[]; outputs?: CompositeWorkflowParamBrief[] } | null | undefined,
  detailParams: GetOntologyFunctionDetailParamItem[],
): { inputs: CompositeWorkflowParamBrief[]; outputs: CompositeWorkflowParamBrief[] } {
  const snapshotInputs = snapshot?.inputs;
  const snapshotOutputs = snapshot?.outputs;
  return {
    inputs: Array.isArray(snapshotInputs) && snapshotInputs.length > 0 ? snapshotInputs : mapCompositeWorkflowDetailParamBriefs(detailParams, "INPUT"),
    outputs: Array.isArray(snapshotOutputs) && snapshotOutputs.length > 0 ? snapshotOutputs : mapCompositeWorkflowDetailParamBriefs(detailParams, "OUTPUT"),
  };
}

/**
 * @description 解析目标节点所有前驱可供下游选择的输出树；支持多入边（分支汇聚）。
 * 条件分支透传其自身上游输出，不另造输出。多入边时每个输出带 sourceNodeId。
 * @param nodes 图节点摘要。
 * @param edges 图边。
 * @param nodeId 目标节点 id。
 * @returns hasUpstream 与 upstreamOutputs。
 */
export function resolveCompositeWorkflowNodeUpstreamOutputs(
  nodes: CompositeWorkflowGraphNodeSummary[],
  edges: CompositeWorkflowGraphEdge[],
  nodeId: string,
): { hasUpstream: boolean; upstreamOutputs: CompositeWorkflowParamBrief[] } {
  const visited = new Set<string>();
  const incoming = edges.filter((edge) => edge.targetNodeId === nodeId);

  if (incoming.length === 0) {
    return { hasUpstream: false, upstreamOutputs: [] };
  }

  if (incoming.length === 1) {
    const firstEdge = incoming[0];
    if (!firstEdge) {
      return { hasUpstream: false, upstreamOutputs: [] };
    }
    return resolveSingleIncoming(nodes, edges, firstEdge, visited);
  }

  const allOutputs: CompositeWorkflowParamBrief[] = [];
  for (const edge of incoming) {
    const singleResult = resolveSingleIncoming(nodes, edges, edge, new Set(visited));
    for (const output of singleResult.upstreamOutputs) {
      allOutputs.push({ ...output, sourceNodeId: edge.sourceNodeId });
    }
  }
  return { hasUpstream: allOutputs.length > 0, upstreamOutputs: allOutputs };
}

/**
 * @description 解析单条入边的上游输出。
 */
function resolveSingleIncoming(
  nodes: CompositeWorkflowGraphNodeSummary[],
  edges: CompositeWorkflowGraphEdge[],
  edge: CompositeWorkflowGraphEdge,
  visited: Set<string>,
): { hasUpstream: boolean; upstreamOutputs: CompositeWorkflowParamBrief[] } {
  if (visited.has(edge.sourceNodeId)) {
    return { hasUpstream: true, upstreamOutputs: [] };
  }
  const source = nodes.find((node) => node.id === edge.sourceNodeId);
  if (!source) {
    return { hasUpstream: true, upstreamOutputs: [] };
  }
  // 分支 / Switch / 循环 done 出口透传上游：不先占用 visited，避免递归入口立即短路。
  if (source.kind === "branch" || source.kind === "switch") {
    return resolveForNodeRecursive(source.id, nodes, edges, visited);
  }
  if (source.kind === "loop") {
    if (edge.loopOutlet === "body") {
      visited.add(edge.sourceNodeId);
      const itemName = source.loopConfig?.itemParamName?.trim() || "item";
      const upstreamOutputs: CompositeWorkflowParamBrief[] = [{ paramName: itemName, paramType: "object" }];
      const indexName = source.loopConfig?.indexParamName?.trim();
      if (indexName) {
        upstreamOutputs.push({ paramName: indexName, paramType: "number" });
      }
      return { hasUpstream: true, upstreamOutputs };
    }
    return resolveForNodeRecursive(source.id, nodes, edges, visited);
  }
  visited.add(edge.sourceNodeId);
  if (source.kind === "function") {
    return { hasUpstream: true, upstreamOutputs: source.paramsSnapshot?.outputs ?? [] };
  }
  if (source.kind === "start") {
    const startOutputs: CompositeWorkflowParamBrief[] = (source.outputParameters ?? []).map((param) => ({
      paramName: param.name,
      paramType: param.type === "number" ? "double" : param.type,
    }));
    return { hasUpstream: true, upstreamOutputs: startOutputs };
  }
  if (source.kind === "transform") {
    return { hasUpstream: true, upstreamOutputs: resolveCompositeWorkflowTransformOutputs(source.transformConfig) };
  }
  return { hasUpstream: true, upstreamOutputs: [] };
}

/**
 * @description 递归沿入边向上解析（用于分支/循环节点透传）。
 */
function resolveForNodeRecursive(
  currentNodeId: string,
  nodes: CompositeWorkflowGraphNodeSummary[],
  edges: CompositeWorkflowGraphEdge[],
  visited: Set<string>,
): { hasUpstream: boolean; upstreamOutputs: CompositeWorkflowParamBrief[] } {
  if (visited.has(currentNodeId)) {
    return { hasUpstream: true, upstreamOutputs: [] };
  }
  visited.add(currentNodeId);
  const incoming = edges.filter((edge) => edge.targetNodeId === currentNodeId);
  if (incoming.length === 0) {
    return { hasUpstream: false, upstreamOutputs: [] };
  }
  if (incoming.length === 1) {
    const firstEdge = incoming[0];
    if (!firstEdge) {
      return { hasUpstream: false, upstreamOutputs: [] };
    }
    return resolveSingleIncoming(nodes, edges, firstEdge, visited);
  }
  const allOutputs: CompositeWorkflowParamBrief[] = [];
  for (const edge of incoming) {
    const singleResult = resolveSingleIncoming(nodes, edges, edge, new Set(visited));
    for (const output of singleResult.upstreamOutputs) {
      allOutputs.push({ ...output, sourceNodeId: edge.sourceNodeId });
    }
  }
  return { hasUpstream: allOutputs.length > 0, upstreamOutputs: allOutputs };
}

/**
 * @description 判断新增边 source→target 是否会在现有有向图中成环。
 * @param edges 现有边。
 * @param sourceNodeId 新边起点。
 * @param targetNodeId 新边终点。
 * @returns 成环时 true。
 */
export function wouldCompositeWorkflowEdgeCreateCycle(edges: CompositeWorkflowGraphEdge[], sourceNodeId: string, targetNodeId: string): boolean {
  if (sourceNodeId === targetNodeId) {
    return true;
  }
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const list = adjacency.get(edge.sourceNodeId) ?? [];
    list.push(edge.targetNodeId);
    adjacency.set(edge.sourceNodeId, list);
  }
  const stack = [targetNodeId];
  const visited = new Set<string>();
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) {
      continue;
    }
    if (current === sourceNodeId) {
      return true;
    }
    visited.add(current);
    for (const next of adjacency.get(current) ?? []) {
      stack.push(next);
    }
  }
  return false;
}

/**
 * @description 目标节点是否已有业务入边（函数节点单前驱约束）。
 * @param edges 现有边。
 * @param targetNodeId 目标节点。
 * @param excludeEdgeId 排除的边 id（重连时）。
 * @returns 已有入边时 true。
 */
export function hasCompositeWorkflowIncomingEdge(edges: CompositeWorkflowGraphEdge[], targetNodeId: string, excludeEdgeId?: string): boolean {
  return edges.some((edge) => edge.targetNodeId === targetNodeId && edge.id !== excludeEdgeId);
}

/**
 * @description 读取绑定路径；旧数据没有 paramPath 时退回参数名本身。
 * @param binding 入参绑定。
 * @returns 从根到叶子的参数名。
 */
function compositeWorkflowBindingPath(binding: CompositeWorkflowInputBinding): string[] {
  if (Array.isArray(binding.paramPath) && binding.paramPath.length > 0) {
    return binding.paramPath;
  }
  return [binding.paramName];
}

/**
 * @description 判断两条参数路径是否相同。
 * @param left 路径。
 * @param right 路径。
 * @returns 相同返回 true。
 */
function isSameCompositeWorkflowParamPath(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

/**
 * @description 收集参数树无下级字段的叶子（下游入参绑定位用）。
 * @param params 参数树。
 * @param prefix 已走过的参数名。
 * @returns 叶子及其路径。
 */
export function listCompositeWorkflowParamLeaves(
  params: CompositeWorkflowParamBrief[],
  prefix: string[] = [],
): Array<{ brief: CompositeWorkflowParamBrief; paramPath: string[] }> {
  const leaves: Array<{ brief: CompositeWorkflowParamBrief; paramPath: string[] }> = [];
  for (const item of params) {
    const paramPath = [...prefix, item.paramName];
    if (item.fields && item.fields.length > 0) {
      leaves.push(...listCompositeWorkflowParamLeaves(item.fields, paramPath));
      continue;
    }
    leaves.push({ brief: item, paramPath });
  }
  return leaves;
}

/**
 * @description 前序收集参数树全部节点（含中间 OBJECT），供上游任意层级选择。
 * @param params 参数树。
 * @param prefix 已走过的参数名。
 * @returns 节点及其路径。
 */
export function listCompositeWorkflowParamNodes(
  params: CompositeWorkflowParamBrief[],
  prefix: string[] = [],
): Array<{ brief: CompositeWorkflowParamBrief; paramPath: string[] }> {
  const nodes: Array<{ brief: CompositeWorkflowParamBrief; paramPath: string[] }> = [];
  for (const item of params) {
    const paramPath = [...prefix, item.paramName];
    nodes.push({ brief: item, paramPath });
    if (item.fields && item.fields.length > 0) {
      nodes.push(...listCompositeWorkflowParamNodes(item.fields, paramPath));
    }
  }
  return nodes;
}

/**
 * @description 将参数路径编码为下拉选项值。
 * @param paramPath 从根到节点的路径。
 * @returns 以 `.` 连接的路径键。
 */
export function compositeWorkflowParamPathKey(paramPath: string[]): string {
  return paramPath.join(".");
}

/**
 * @description 解析路径键为参数路径。
 * @param pathKey 路径键。
 * @returns 参数路径；空键返回空数组。
 */
export function parseCompositeWorkflowParamPathKey(pathKey: string): string[] {
  const trimmed = pathKey.trim();
  return trimmed ? trimmed.split(".") : [];
}

/**
 * @description 在节点列表中按路径查找。
 * @param nodes 节点列表。
 * @param paramPath 目标路径。
 * @returns 匹配节点；未找到返回 undefined。
 */
export function findCompositeWorkflowParamLeaf(
  nodes: Array<{ brief: CompositeWorkflowParamBrief; paramPath: string[] }>,
  paramPath: string[],
): { brief: CompositeWorkflowParamBrief; paramPath: string[] } | undefined {
  return nodes.find((item) => isSameCompositeWorkflowParamPath(item.paramPath, paramPath));
}

/**
 * @description 解析 fromUpstream 绑定的上游路径；仅认完整路径或顶层单段精确名，不做同名猜测。
 * @param binding 上游绑定。
 * @param outputNodes 上游 OUTPUT 全节点。
 * @returns 上游路径；无法解析返回 null。
 */
function resolveCompositeWorkflowUpstreamNodePath(
  binding: Extract<CompositeWorkflowInputBinding, { mode: "fromUpstream" }>,
  outputNodes: Array<{ brief: CompositeWorkflowParamBrief; paramPath: string[] }>,
): string[] | null {
  if (Array.isArray(binding.upstreamParamPath) && binding.upstreamParamPath.length > 0) {
    return binding.upstreamParamPath;
  }
  const exactTop = outputNodes.find((item) => item.paramPath.length === 1 && item.paramPath[0] === binding.upstreamParamName);
  return exactTop?.paramPath ?? null;
}

/**
 * @description 为下游 INPUT 叶子生成默认绑定：一律 manual 空值，不自动匹配上游。
 * @param inputs 下游 INPUT。
 * @param _upstreamOutputs 上游 OUTPUT（保留参数以兼容调用方）。
 * @param _hasUpstream 是否存在前驱（保留参数以兼容调用方）。
 * @returns 叶子绑定列表。
 */
export function buildDefaultCompositeWorkflowInputBindings(
  inputs: CompositeWorkflowParamBrief[],
  _upstreamOutputs: CompositeWorkflowParamBrief[],
  _hasUpstream: boolean,
): CompositeWorkflowInputBinding[] {
  return listCompositeWorkflowParamLeaves(inputs).map(({ brief, paramPath }) => ({
    mode: "manual" as const,
    paramName: brief.paramName,
    paramPath,
    value: "",
  }));
}

/**
 * @description 自动配置绑定：按参数名匹配上游输出到下游输入，类型兼容时设为 fromUpstream，否则 manual。
 * @param inputs 下游 INPUT。
 * @param upstreamOutputs 上游 OUTPUT。
 * @param hasUpstream 是否有前驱。
 * @returns 自动匹配后的绑定列表。
 */
export function buildAutoConfiguredCompositeWorkflowInputBindings(
  inputs: CompositeWorkflowParamBrief[],
  upstreamOutputs: CompositeWorkflowParamBrief[],
  hasUpstream: boolean,
): CompositeWorkflowInputBinding[] {
  const inputLeaves = listCompositeWorkflowParamLeaves(inputs);
  const outputNodes = listCompositeWorkflowParamNodes(upstreamOutputs);

  return inputLeaves.map(({ brief, paramPath }) => {
    if (!hasUpstream || outputNodes.length === 0) {
      return {
        mode: "manual" as const,
        paramName: brief.paramName,
        paramPath,
        value: "",
      };
    }

    const matchedOutput = outputNodes.find((node) => node.brief.paramName === brief.paramName);
    if (!matchedOutput) {
      return {
        mode: "manual" as const,
        paramName: brief.paramName,
        paramPath,
        value: "",
      };
    }

    const compared = compareCompositeWorkflowParamTypes(matchedOutput.brief.paramType, brief.paramType);
    if (!compared.compatible) {
      return {
        mode: "manual" as const,
        paramName: brief.paramName,
        paramPath,
        value: "",
      };
    }

    return {
      mode: "fromUpstream" as const,
      paramName: brief.paramName,
      paramPath,
      upstreamParamName: matchedOutput.brief.paramName,
      upstreamParamPath: matchedOutput.paramPath,
      sourceNodeId: matchedOutput.brief.sourceNodeId,
    };
  });
}

/**
 * @description 前驱变更后修复绑定：无效 fromUpstream 降为 manual，并补齐 paramPath / upstreamParamPath。
 * @param bindings 原绑定。
 * @param upstreamOutputs 新前驱 OUTPUT；无前驱传空。
 * @param hasUpstream 是否有前驱。
 * @returns 修复后的绑定。
 */
export function repairCompositeWorkflowInputBindings(
  bindings: CompositeWorkflowInputBinding[],
  upstreamOutputs: CompositeWorkflowParamBrief[],
  hasUpstream: boolean,
): CompositeWorkflowInputBinding[] {
  const outputNodes = listCompositeWorkflowParamNodes(upstreamOutputs);
  return bindings.map((binding) => {
    const paramPath = compositeWorkflowBindingPath(binding);
    if (binding.mode === "manual") {
      return { ...binding, paramPath };
    }
    if (!hasUpstream) {
      return { mode: "manual" as const, paramName: binding.paramName, paramPath, value: "" };
    }
    const upstreamPath = resolveCompositeWorkflowUpstreamNodePath(binding, outputNodes);
    const node = upstreamPath ? findCompositeWorkflowParamLeaf(outputNodes, upstreamPath) : undefined;
    if (!node) {
      return { mode: "manual" as const, paramName: binding.paramName, paramPath, value: "" };
    }
    return {
      mode: "fromUpstream" as const,
      paramName: binding.paramName,
      paramPath,
      upstreamParamName: node.brief.paramName,
      upstreamParamPath: node.paramPath,
    };
  });
}

/**
 * @description 按当前入参叶子对齐绑定：叶子沿用同路径旧值，对象级旧绑定改为叶子默认绑定。
 * @param inputs 下游 INPUT。
 * @param bindings 已保存绑定。
 * @param upstreamOutputs 上游 OUTPUT。
 * @param hasUpstream 是否存在前驱。
 * @returns 与叶子一一对应的绑定。
 */
export function alignCompositeWorkflowInputBindings(
  inputs: CompositeWorkflowParamBrief[],
  bindings: CompositeWorkflowInputBinding[],
  upstreamOutputs: CompositeWorkflowParamBrief[],
  hasUpstream: boolean,
): CompositeWorkflowInputBinding[] {
  const defaults = buildDefaultCompositeWorkflowInputBindings(inputs, upstreamOutputs, hasUpstream);
  return defaults.map((fallback) => {
    const existing = bindings.find((item) => isSameCompositeWorkflowParamPath(compositeWorkflowBindingPath(item), fallback.paramPath));
    if (!existing) {
      return fallback;
    }
    const repaired = repairCompositeWorkflowInputBindings(
      [{ ...existing, paramName: fallback.paramName, paramPath: fallback.paramPath }],
      upstreamOutputs,
      hasUpstream,
    );
    return repaired[0] ?? fallback;
  });
}

/**
 * @description 校验函数节点入参绑定完整性与 fromUpstream 类型兼容。
 * @param node 函数节点摘要。
 * @param upstreamOutputs 前驱输出；无前驱传空。
 * @param hasUpstream 是否有前驱。
 * @returns 错误信息；通过返回 null。
 */
export function validateCompositeWorkflowFunctionBindings(
  node: CompositeWorkflowGraphNodeSummary,
  upstreamOutputs: CompositeWorkflowParamBrief[],
  hasUpstream: boolean,
): string | null {
  const inputs = node.paramsSnapshot?.inputs ?? [];
  const leaves = listCompositeWorkflowParamLeaves(inputs);
  const outputNodes = listCompositeWorkflowParamNodes(upstreamOutputs);
  const bindings = node.inputBindings ?? [];
  if (leaves.length === 0) {
    return null;
  }
  for (const leaf of leaves) {
    const binding = bindings.find((item) => isSameCompositeWorkflowParamPath(compositeWorkflowBindingPath(item), leaf.paramPath));
    const label = leaf.paramPath.join(".");
    if (!binding) {
      return `节点「${node.displayName || node.id}」缺少入参「${label}」绑定`;
    }
    if (binding.mode === "fromUpstream") {
      if (!hasUpstream) {
        return `节点「${node.displayName || node.id}」入参「${label}」引用了上游但无前驱`;
      }
      const upstreamPath = resolveCompositeWorkflowUpstreamNodePath(binding, outputNodes);
      const upstream = upstreamPath ? findCompositeWorkflowParamLeaf(outputNodes, upstreamPath) : undefined;
      if (!upstream) {
        return `节点「${node.displayName || node.id}」入参「${label}」引用的上游输出不存在`;
      }
      const compared = compareCompositeWorkflowParamTypes(upstream.brief.paramType, leaf.brief.paramType);
      if (!compared.compatible) {
        return `节点「${node.displayName || node.id}」入参「${label}」类型与上游「${compositeWorkflowParamPathKey(upstream.paramPath)}」不兼容`;
      }
    }
  }
  return null;
}

/**
 * @description 组装编排保存载荷。
 * @param options 组装选项。
 * @returns 保存载荷。
 */
export function buildCompositeWorkflowSavePayload(options: {
  displayName: string;
  functionApi: string;
  version: string;
  ontologySpaceId: number;
  logicFlowGraph: unknown;
  nodes: CompositeWorkflowGraphNodeSummary[];
  edges: CompositeWorkflowGraphEdge[];
  savedAt?: string;
}): CompositeWorkflowSavePayload {
  const nodes: Array<CompositeWorkflowFunctionNodePayload | CompositeWorkflowLogicNodePayload | CompositeWorkflowEndpointNodePayload> = options.nodes.map(
    (node) => {
      if (node.kind === "function") {
        return {
          id: node.id,
          kind: "function",
          functionId: node.functionApi ?? "",
          version: node.version ?? "",
          displayName: node.displayName ?? "",
          inputBindings: node.inputBindings ?? [],
          paramsSnapshot: node.paramsSnapshot,
        };
      }
      if (node.kind === "loop") {
        return {
          id: node.id,
          kind: "loop",
          config: normalizeCompositeWorkflowLoopConfig(node.loopConfig ?? createDefaultCompositeWorkflowLoopConfig()),
        };
      }
      if (node.kind === "branch") {
        return {
          id: node.id,
          kind: "branch",
          config: normalizeCompositeWorkflowBranchConfig(node.branchConfig ?? createDefaultCompositeWorkflowBranchConfig()),
        };
      }
      if (node.kind === "switch") {
        return {
          id: node.id,
          kind: "switch",
          config: normalizeCompositeWorkflowSwitchConfig(node.switchConfig ?? createDefaultCompositeWorkflowSwitchConfig()),
        };
      }
      if (node.kind === "start") {
        return {
          id: node.id,
          kind: "start" as const,
          label: "开始",
          outputParameters: node.outputParameters ?? [],
        };
      }
      if (node.kind === "end") {
        return {
          id: node.id,
          kind: "end" as const,
          label: "结束",
          inputParameters: node.inputParameters ?? [],
          inputBindings: node.inputBindings ?? [],
        };
      }
      return {
        id: node.id,
        kind: "transform",
        config: node.transformConfig ?? createDefaultCompositeWorkflowTransformConfig(),
      };
    },
  );
  const edges: CompositeWorkflowEdgePayload[] = options.edges.map((edge) => ({
    id: edge.id,
    sourceNodeId: edge.sourceNodeId,
    targetNodeId: edge.targetNodeId,
    branch: edge.branch,
    switchOutlet: edge.switchOutlet,
    loopOutlet: edge.loopOutlet,
  }));
  return {
    schemaVersion: 1,
    meta: {
      displayName: options.displayName.trim(),
      functionApi: options.functionApi.trim(),
      version: options.version.trim(),
      ontologySpaceId: options.ontologySpaceId,
      savedAt: options.savedAt ?? new Date().toISOString(),
    },
    graph: { logicFlow: options.logicFlowGraph },
    nodes,
    edges,
  };
}

/**
 * @description 从编排保存载荷中解析可供 LogicFlow.render 的 logicFlow 图数据。
 * @param config 详情或草稿中的 compositeConfig；缺省或结构非法时返回 null。
 * @returns `{ nodes, edges }`；无法回显时为 null。
 */
export function resolveCompositeWorkflowLogicFlowForRender(config: unknown): { nodes: unknown[]; edges: unknown[] } | null {
  if (!config || typeof config !== "object") {
    return null;
  }
  const graph = (config as { graph?: unknown }).graph;
  if (!graph || typeof graph !== "object") {
    return null;
  }
  const logicFlow = (graph as { logicFlow?: unknown }).logicFlow;
  if (!logicFlow || typeof logicFlow !== "object") {
    return null;
  }
  const record = logicFlow as { nodes?: unknown; edges?: unknown };
  if (!Array.isArray(record.nodes) || !Array.isArray(record.edges)) {
    return null;
  }
  return { nodes: record.nodes, edges: record.edges };
}

/**
 * @description 保存前校验整图：函数绑定与类型；返回首条错误。无函数节点返回 warning 文案（调用方可仍打印）。
 * @param nodes 节点摘要。
 * @param edges 边。
 * @returns error 阻断错误；warning 非阻断提示。
 */
export function validateCompositeWorkflowForSave(
  nodes: CompositeWorkflowGraphNodeSummary[],
  edges: CompositeWorkflowGraphEdge[],
): { error: string | null; warning: string | null } {
  const functionNodes = nodes.filter((node) => node.kind === "function");
  const warning = functionNodes.length === 0 ? "画布尚无函数节点" : null;

  for (const node of functionNodes) {
    const { hasUpstream, upstreamOutputs } = resolveCompositeWorkflowNodeUpstreamOutputs(nodes, edges, node.id);
    const error = validateCompositeWorkflowFunctionBindings(node, upstreamOutputs, hasUpstream);
    if (error) {
      return { error, warning };
    }
  }
  for (const node of nodes.filter((item) => item.kind === "transform")) {
    const inputs = node.transformConfig?.paramsSnapshot?.inputs ?? [];
    if (inputs.length === 0) {
      continue;
    }
    const { hasUpstream, upstreamOutputs } = resolveCompositeWorkflowNodeUpstreamOutputs(nodes, edges, node.id);
    const synthetic: CompositeWorkflowGraphNodeSummary = {
      ...node,
      inputBindings: node.transformConfig?.inputBindings,
      paramsSnapshot: node.transformConfig?.paramsSnapshot,
    };
    const error = validateCompositeWorkflowFunctionBindings(synthetic, upstreamOutputs, hasUpstream);
    if (error) {
      return { error, warning };
    }
  }
  return { error: null, warning };
}
