import type { CompositeWorkflowNodeKind } from "@/types";

/** 参与 Dagre 布局的节点摘要。 */
export interface CompositeWorkflowDagreLayoutNode {
  id: string;
  kind?: CompositeWorkflowNodeKind;
  width?: number;
  height?: number;
}

/** 参与 Dagre 布局的边摘要。 */
export interface CompositeWorkflowDagreLayoutEdge {
  sourceNodeId: string;
  targetNodeId: string;
}

/** 布局后的节点中心坐标（LogicFlow moveNode2Coordinate）。 */
export interface CompositeWorkflowDagreLayoutPosition {
  id: string;
  x: number;
  y: number;
}

const DEFAULT_NODE_SIZE = { width: 180, height: 64 } as const;
const BRANCH_NODE_SIZE = { width: 180, height: 112 } as const;
const ISOLATED_COLUMN_GAP = 220;

/**
 * @description 按节点 kind 解析布局用宽高。
 * @param node 节点摘要。
 * @returns 宽高。
 */
function resolveCompositeWorkflowDagreNodeSize(node: CompositeWorkflowDagreLayoutNode): { width: number; height: number } {
  if (typeof node.width === "number" && typeof node.height === "number" && node.width > 0 && node.height > 0) {
    return { width: node.width, height: node.height };
  }
  if (node.kind === "branch") {
    return { ...BRANCH_NODE_SIZE };
  }
  return { ...DEFAULT_NODE_SIZE };
}

/**
 * @description 从布局结果读取带坐标的节点。
 * @param nodes 布局返回节点。
 * @returns 中心坐标列表。
 */
function readCompositeWorkflowDagrePositions(nodes: unknown): CompositeWorkflowDagreLayoutPosition[] {
  if (!Array.isArray(nodes)) {
    return [];
  }
  const positions: CompositeWorkflowDagreLayoutPosition[] = [];
  for (const item of nodes) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.x !== "number" || typeof record.y !== "number") {
      continue;
    }
    if (!Number.isFinite(record.x) || !Number.isFinite(record.y)) {
      continue;
    }
    positions.push({ id: record.id, x: record.x, y: record.y });
  }
  return positions;
}

/**
 * @description 使用 Dagre 对编排节点做左右分层布局；孤立节点补到结果右侧，保证不丢点。
 * @param nodes 节点列表。
 * @param edges 边列表。
 * @returns 节点中心坐标。
 */
export async function layoutCompositeWorkflowNodesWithDagre(
  nodes: CompositeWorkflowDagreLayoutNode[],
  edges: CompositeWorkflowDagreLayoutEdge[],
): Promise<CompositeWorkflowDagreLayoutPosition[]> {
  if (nodes.length === 0) {
    return [];
  }
  const { DagreLayout } = await import("@antv/layout");
  const layoutNodes = nodes.map((node) => {
    const size = resolveCompositeWorkflowDagreNodeSize(node);
    return { id: node.id, size: [size.width, size.height] as [number, number] };
  });
  const seenEdge = new Set<string>();
  const layoutEdges: Array<{ source: string; target: string }> = [];
  for (const edge of edges) {
    const source = edge.sourceNodeId.trim();
    const target = edge.targetNodeId.trim();
    if (!source || !target || source === target) {
      continue;
    }
    const key = `${source}->${target}`;
    if (seenEdge.has(key)) {
      continue;
    }
    seenEdge.add(key);
    layoutEdges.push({ source, target });
  }
  const dagreLayout = new DagreLayout({
    type: "dagre",
    rankdir: "LR",
    align: "UL",
    nodesep: 48,
    ranksep: 100,
    begin: [160, 120],
    controlPoints: false,
  });
  const result = dagreLayout.layout({
    nodes: layoutNodes,
    edges: layoutEdges,
  });
  const positions = readCompositeWorkflowDagrePositions(result.nodes);
  const positionedIds = new Set(positions.map((item) => item.id));
  const missing = nodes.filter((node) => !positionedIds.has(node.id));
  if (missing.length === 0) {
    return positions;
  }
  const maxX = positions.reduce((current, item) => Math.max(current, item.x), 160);
  const baseY = positions.length > 0 ? (positions[0]?.y ?? 120) : 120;
  missing.forEach((node, index) => {
    positions.push({
      id: node.id,
      x: maxX + ISOLATED_COLUMN_GAP * (index + 1),
      y: baseY,
    });
  });
  return positions;
}
