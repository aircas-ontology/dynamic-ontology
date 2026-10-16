import type { CompositeWorkflowGraphEdge, CompositeWorkflowGraphNodeSummary } from "./compositeWorkflowGraph.ts";

/** LiteFlow EL 转换结果。 */
export interface CompositeWorkflowLiteFlowElResult {
  expression: string;
  warnings: string[];
}

/**
 * @description 将编排图转为 LiteFlow EL。串行用 THEN，扇出用 WHEN，分支用 IF；循环与转换按普通组件顺序输出。
 * @param nodes 节点摘要。
 * @param edges 边。
 * @returns EL 表达式与无法完整表达时的警告。
 */
export function buildCompositeWorkflowLiteFlowEl(
  nodes: CompositeWorkflowGraphNodeSummary[],
  edges: CompositeWorkflowGraphEdge[],
): CompositeWorkflowLiteFlowElResult {
  const warnings: string[] = [];
  if (nodes.length === 0) {
    return { expression: "", warnings: ["画布没有节点，无法生成 LiteFlow EL"] };
  }
  const idMap = buildLiteFlowNodeIdMap(nodes);
  const outgoing = new Map<string, CompositeWorkflowGraphEdge[]>();
  const incomingCount = new Map<string, number>();
  for (const node of nodes) {
    outgoing.set(node.id, []);
    incomingCount.set(node.id, 0);
  }
  for (const edge of edges) {
    outgoing.get(edge.sourceNodeId)?.push(edge);
    incomingCount.set(edge.targetNodeId, (incomingCount.get(edge.targetNodeId) ?? 0) + 1);
  }
  const adjacency = new Map<string, string[]>();
  for (const [sourceId, sourceEdges] of outgoing) {
    adjacency.set(
      sourceId,
      sourceEdges.map((edge) => edge.targetNodeId),
    );
  }
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const emitted = new Set<string>();

  /**
   * @description 从指定节点生成 EL 片段，遇到 stop 集合中的节点即停止（用于汇合点）。
   * @param nodeId 当前节点。
   * @param stopIds 不进入的节点。
   * @param stack 当前路径，用于截断环。
   * @returns EL 片段。
   */
  function emitFrom(nodeId: string, stopIds: Set<string>, stack: Set<string>): string {
    if (!nodeId || stopIds.has(nodeId)) {
      return "";
    }
    if (stack.has(nodeId)) {
      warnings.push(`节点「${idMap.get(nodeId) ?? nodeId}」位于环路中，已截断`);
      return "";
    }
    const node = nodeById.get(nodeId);
    if (!node) {
      return "";
    }
    stack.add(nodeId);
    emitted.add(nodeId);
    const elId = idMap.get(nodeId) ?? nodeId;
    const outs = outgoing.get(nodeId) ?? [];
    let expression = "";
    if (node.kind === "branch") {
      expression = emitBranch(elId, outs, stopIds, stack);
    } else if (outs.length === 0) {
      expression = elId;
    } else if (outs.length === 1) {
      const nextId = outs[0]?.targetNodeId ?? "";
      expression = combineSerial(elId, stopIds.has(nextId) ? "" : emitFrom(nextId, stopIds, stack));
    } else {
      expression = emitFanOut(elId, outs, stopIds, stack);
    }
    stack.delete(nodeId);
    return expression;
  }

  /**
   * @description 生成分支 IF。true / false 出口在汇合点之前分别展开。
   * @param elId 分支组件 id。
   * @param outs 出边。
   * @param stopIds 上层汇合点。
   * @param stack 路径栈。
   * @returns IF 表达式，若之后还有汇合节点则串成 THEN。
   */
  function emitBranch(elId: string, outs: CompositeWorkflowGraphEdge[], stopIds: Set<string>, stack: Set<string>): string {
    const trueEdge = outs.find((edge) => edge.branch === "true");
    const falseEdge = outs.find((edge) => edge.branch === "false");
    if (!trueEdge) {
      warnings.push(`分支「${elId}」缺少 true 出口`);
    }
    if (!falseEdge) {
      warnings.push(`分支「${elId}」缺少 false 出口`);
    }
    const targets = [trueEdge?.targetNodeId, falseEdge?.targetNodeId].filter((item): item is string => Boolean(item));
    const joinId = findClosestCommonDescendant(targets, adjacency);
    const nextStop = new Set(stopIds);
    if (joinId) {
      nextStop.add(joinId);
    }
    const trueExpression = trueEdge ? emitFrom(trueEdge.targetNodeId, nextStop, stack) : "";
    const falseExpression = falseEdge ? emitFrom(falseEdge.targetNodeId, nextStop, stack) : "";
    let branchExpression = elId;
    if (trueExpression && falseExpression) {
      branchExpression = `IF(${elId}, ${trueExpression}, ${falseExpression})`;
    } else if (trueExpression) {
      branchExpression = `IF(${elId}, ${trueExpression})`;
    } else if (falseExpression) {
      branchExpression = `IF(${elId}, ${falseExpression})`;
    }
    if (!joinId || stopIds.has(joinId)) {
      return branchExpression;
    }
    return combineSerial(branchExpression, emitFrom(joinId, stopIds, stack));
  }

  /**
   * @description 生成扇出 WHEN，并在公共后继处汇合。
   * @param elId 当前组件 id。
   * @param outs 出边。
   * @param stopIds 上层汇合点。
   * @param stack 路径栈。
   * @returns THEN/WHEN 表达式。
   */
  function emitFanOut(elId: string, outs: CompositeWorkflowGraphEdge[], stopIds: Set<string>, stack: Set<string>): string {
    const targets = outs.map((edge) => edge.targetNodeId);
    const joinId = findClosestCommonDescendant(targets, adjacency);
    const nextStop = new Set(stopIds);
    if (joinId) {
      nextStop.add(joinId);
    }
    const branchExpressions = outs.map((edge) => emitFrom(edge.targetNodeId, nextStop, stack)).filter((item) => item.length > 0);
    let parallel = "";
    if (branchExpressions.length > 1) {
      parallel = `WHEN(${branchExpressions.join(", ")})`;
    } else if (branchExpressions.length === 1) {
      parallel = branchExpressions[0] ?? "";
    }
    const head = combineSerial(elId, parallel);
    if (!joinId || stopIds.has(joinId)) {
      return head;
    }
    return combineSerial(head, emitFrom(joinId, stopIds, stack));
  }

  const starts = nodes.filter((node) => (incomingCount.get(node.id) ?? 0) === 0);
  const startIds = (starts.length > 0 ? starts : nodes.slice(0, 1)).map((node) => node.id);
  if (starts.length === 0) {
    warnings.push("没有入度为 0 的起点，EL 从第一个节点截断生成");
  }
  const startJoin = startIds.length > 1 ? findClosestCommonDescendant(startIds, adjacency) : null;
  const startStop = new Set<string>();
  if (startJoin) {
    startStop.add(startJoin);
  }
  const startExpressions = startIds.map((nodeId) => emitFrom(nodeId, startStop, new Set())).filter((item) => item.length > 0);
  let expression = "";
  if (startExpressions.length > 1) {
    expression = `WHEN(${startExpressions.join(", ")})`;
  } else {
    expression = startExpressions[0] ?? "";
  }
  if (startJoin) {
    expression = combineSerial(expression, emitFrom(startJoin, new Set(), new Set()));
  }
  for (const node of nodes) {
    if (!emitted.has(node.id)) {
      warnings.push(`节点「${idMap.get(node.id) ?? node.id}」未被主链覆盖，未写入 EL`);
    }
  }
  if (!expression) {
    warnings.push("未能生成 LiteFlow EL");
    return { expression: "", warnings };
  }
  return { expression: `${expression};`, warnings };
}

/**
 * @description 把节点 id 转成 LiteFlow 组件名（仅字母、数字、下划线，且不重复）。
 * @param nodes 节点列表。
 * @returns 原 id 到 EL id 的映射。
 */
function buildLiteFlowNodeIdMap(nodes: CompositeWorkflowGraphNodeSummary[]): Map<string, string> {
  const used = new Set<string>();
  const idMap = new Map<string, string>();
  for (const node of nodes) {
    let base = node.id.replace(/[^A-Za-z0-9_]/g, "_");
    if (!/^[A-Za-z_]/.test(base)) {
      base = `n_${base}`;
    }
    let nextId = base;
    let suffix = 2;
    while (used.has(nextId)) {
      nextId = `${base}_${suffix}`;
      suffix += 1;
    }
    used.add(nextId);
    idMap.set(node.id, nextId);
  }
  return idMap;
}

/**
 * @description 串行合并两段 EL，展平多余的 THEN。
 * @param left 左段。
 * @param right 右段。
 * @returns 合并后的表达式。
 */
function combineSerial(left: string, right: string): string {
  const parts = [...unwrapThen(left), ...unwrapThen(right)].filter((item) => item.length > 0);
  if (parts.length === 0) {
    return "";
  }
  if (parts.length === 1) {
    return parts[0] ?? "";
  }
  return `THEN(${parts.join(", ")})`;
}

/**
 * @description 若表达式是顶层 THEN，拆成参数列表。
 * @param expression EL 片段。
 * @returns 参数列表。
 */
function unwrapThen(expression: string): string[] {
  if (!expression) {
    return [];
  }
  if (expression.startsWith("THEN(") && expression.endsWith(")") && isWrappedByOuterParens(expression, 5)) {
    return splitTopLevelArgs(expression.slice(5, -1));
  }
  return [expression];
}

/**
 * @description 判断从 prefixLength 起到末尾的括号是否正好包住内部。
 * @param expression 表达式。
 * @param prefixLength 前缀长度（THEN( 为 5）。
 * @returns 是否为单层包裹。
 */
function isWrappedByOuterParens(expression: string, prefixLength: number): boolean {
  let depth = 0;
  for (let index = prefixLength; index < expression.length - 1; index += 1) {
    const char = expression[index];
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth < 0) {
        return false;
      }
    }
  }
  return depth === 0;
}

/**
 * @description 按顶层逗号拆分参数。
 * @param source 参数串。
 * @returns 参数列表。
 */
function splitTopLevelArgs(source: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of source) {
    if (char === "(") {
      depth += 1;
      current += char;
    } else if (char === ")") {
      depth -= 1;
      current += char;
    } else if (char === "," && depth === 0) {
      args.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    args.push(current.trim());
  }
  return args;
}

/**
 * @description 求多个起点的最近公共后继（含起点自身，用于直接汇合）。
 * @param targets 起点 id。
 * @param adjacency 邻接表。
 * @returns 公共后继；没有时返回 null。
 */
function findClosestCommonDescendant(targets: string[], adjacency: Map<string, string[]>): string | null {
  const uniqueTargets = [...new Set(targets)];
  if (uniqueTargets.length < 2) {
    return null;
  }
  const reaches = uniqueTargets.map((target) => collectReachable(target, adjacency));
  const [first, ...rest] = reaches;
  if (!first) {
    return null;
  }
  const common = [...first].filter((nodeId) => rest.every((reachable) => reachable.has(nodeId)));
  if (common.length === 0) {
    return null;
  }
  common.sort((left, right) => scoreDistance(uniqueTargets, left, adjacency) - scoreDistance(uniqueTargets, right, adjacency));
  return common[0] ?? null;
}

/**
 * @description 收集从起点可达的节点（含起点）。
 * @param startId 起点。
 * @param adjacency 邻接表。
 * @returns 可达集合。
 */
function collectReachable(startId: string, adjacency: Map<string, string[]>): Set<string> {
  const seen = new Set<string>();
  const queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) {
      continue;
    }
    seen.add(current);
    for (const nextId of adjacency.get(current) ?? []) {
      queue.push(nextId);
    }
  }
  return seen;
}

/**
 * @description 计算多个起点到目标的距离和，用于挑选最近汇合点。
 * @param starts 起点。
 * @param targetId 目标。
 * @param adjacency 邻接表。
 * @returns 距离和。
 */
function scoreDistance(starts: string[], targetId: string, adjacency: Map<string, string[]>): number {
  return starts.reduce((sum, startId) => sum + distanceBetween(startId, targetId, adjacency), 0);
}

/**
 * @description 求两点最短边数。
 * @param fromId 起点。
 * @param toId 终点。
 * @param adjacency 邻接表。
 * @returns 距离；不可达时为极大值。
 */
function distanceBetween(fromId: string, toId: string, adjacency: Map<string, string[]>): number {
  const queue: Array<{ id: string; dist: number }> = [{ id: fromId, dist: 0 }];
  const seen = new Set<string>();
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item || seen.has(item.id)) {
      continue;
    }
    if (item.id === toId) {
      return item.dist;
    }
    seen.add(item.id);
    for (const nextId of adjacency.get(item.id) ?? []) {
      queue.push({ id: nextId, dist: item.dist + 1 });
    }
  }
  return Number.MAX_SAFE_INTEGER;
}
