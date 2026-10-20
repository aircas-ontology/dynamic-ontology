import type {
  CompositeWorkflowBranchConfig,
  CompositeWorkflowEdgePayload,
  CompositeWorkflowFunctionNodePayload,
  CompositeWorkflowInputBinding,
  CompositeWorkflowLogicNodePayload,
  CompositeWorkflowLoopConfig,
  CompositeWorkflowNodeKind,
  CompositeWorkflowParamBrief,
  CompositeWorkflowSavePayload,
  CompositeWorkflowTransformConfig,
  GetOntologyFunctionDetailParamItem,
} from "@/types";

import { compareCompositeWorkflowParamTypes } from "./compositeWorkflowParamType.ts";

/** 图中用于校验的边。 */
export interface CompositeWorkflowGraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  branch?: "true" | "false";
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
 * @description 收集无下级字段的入参叶子。
 * @param inputs 参数树。
 * @param prefix 已走过的参数名。
 * @returns 叶子及其路径。
 */
function listCompositeWorkflowInputLeaves(
  inputs: CompositeWorkflowParamBrief[],
  prefix: string[] = [],
): Array<{ brief: CompositeWorkflowParamBrief; paramPath: string[] }> {
  const leaves: Array<{ brief: CompositeWorkflowParamBrief; paramPath: string[] }> = [];
  for (const input of inputs) {
    const paramPath = [...prefix, input.paramName];
    if (input.fields && input.fields.length > 0) {
      leaves.push(...listCompositeWorkflowInputLeaves(input.fields, paramPath));
      continue;
    }
    leaves.push({ brief: input, paramPath });
  }
  return leaves;
}

/**
 * @description 按上游 OUTPUT 与下游 INPUT 叶子生成默认同名 fromUpstream 绑定；无前驱则全部 manual 空值。
 * @param inputs 下游 INPUT。
 * @param upstreamOutputs 上游 OUTPUT；无前驱传空数组。
 * @param hasUpstream 是否存在前驱。
 * @returns 叶子绑定列表。
 */
export function buildDefaultCompositeWorkflowInputBindings(
  inputs: CompositeWorkflowParamBrief[],
  upstreamOutputs: CompositeWorkflowParamBrief[],
  hasUpstream: boolean,
): CompositeWorkflowInputBinding[] {
  const outputNames = new Set(upstreamOutputs.map((item) => item.paramName));
  return listCompositeWorkflowInputLeaves(inputs).map(({ brief, paramPath }) => {
    if (hasUpstream && outputNames.has(brief.paramName)) {
      return { mode: "fromUpstream" as const, paramName: brief.paramName, paramPath, upstreamParamName: brief.paramName };
    }
    return { mode: "manual" as const, paramName: brief.paramName, paramPath, value: "" };
  });
}

/**
 * @description 前驱变更后修复绑定：无效 fromUpstream 降为 manual，并补齐 paramPath。
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
  const outputNames = new Set(upstreamOutputs.map((item) => item.paramName));
  return bindings.map((binding) => {
    const paramPath = compositeWorkflowBindingPath(binding);
    if (binding.mode === "manual") {
      return { ...binding, paramPath };
    }
    if (!hasUpstream || !outputNames.has(binding.upstreamParamName)) {
      return { mode: "manual" as const, paramName: binding.paramName, paramPath, value: "" };
    }
    return { ...binding, paramPath };
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
  const leaves = listCompositeWorkflowInputLeaves(inputs);
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
      const upstream = upstreamOutputs.find((item) => item.paramName === binding.upstreamParamName);
      if (!upstream) {
        return `节点「${node.displayName || node.id}」入参「${label}」引用的上游输出不存在`;
      }
      const compared = compareCompositeWorkflowParamTypes(upstream.paramType, leaf.brief.paramType);
      if (!compared.compatible) {
        return `节点「${node.displayName || node.id}」入参「${label}」类型与上游「${upstream.paramName}」不兼容`;
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
  const nodes: Array<CompositeWorkflowFunctionNodePayload | CompositeWorkflowLogicNodePayload> = options.nodes.map((node) => {
    if (node.kind === "function") {
      return {
        id: node.id,
        kind: "function",
        functionApi: node.functionApi ?? "",
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
        config: node.loopConfig ?? {
          kind: "loop",
          collection: { mode: "manual", jsonText: "[]" },
          itemParamName: "item",
          maxIterations: 100,
        },
      };
    }
    if (node.kind === "branch") {
      return {
        id: node.id,
        kind: "branch",
        config: node.branchConfig ?? {
          kind: "branch",
          left: { mode: "manual", value: "" },
          operator: "truthy",
        },
      };
    }
    return {
      id: node.id,
      kind: "transform",
      config: node.transformConfig ?? {
        kind: "transform",
        language: "javascript",
        code: "function transform(input) {\n  return { result: input };\n}\n",
        outputKeys: ["result"],
      },
    };
  });
  const edges: CompositeWorkflowEdgePayload[] = options.edges.map((edge) => ({
    id: edge.id,
    sourceNodeId: edge.sourceNodeId,
    targetNodeId: edge.targetNodeId,
    branch: edge.branch,
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
  const incomingByTarget = new Map<string, CompositeWorkflowGraphEdge[]>();
  for (const edge of edges) {
    const list = incomingByTarget.get(edge.targetNodeId) ?? [];
    list.push(edge);
    incomingByTarget.set(edge.targetNodeId, list);
  }
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  for (const node of functionNodes) {
    const incoming = incomingByTarget.get(node.id) ?? [];
    const hasUpstream = incoming.length > 0;
    let upstreamOutputs: CompositeWorkflowParamBrief[] = [];
    if (hasUpstream) {
      const source = nodeById.get(incoming[0]?.sourceNodeId ?? "");
      if (source?.kind === "function") {
        upstreamOutputs = source.paramsSnapshot?.outputs ?? [];
      } else if (source?.kind === "transform") {
        upstreamOutputs = (source.transformConfig?.outputKeys ?? ["result"]).map((paramName) => ({
          paramName,
          paramType: "object",
        }));
      } else if (source?.kind === "loop") {
        const itemName = source.loopConfig?.itemParamName?.trim() || "item";
        upstreamOutputs = [{ paramName: itemName, paramType: "object" }];
      }
    }
    const error = validateCompositeWorkflowFunctionBindings(node, upstreamOutputs, hasUpstream);
    if (error) {
      return { error, warning };
    }
  }
  return { error: null, warning };
}
