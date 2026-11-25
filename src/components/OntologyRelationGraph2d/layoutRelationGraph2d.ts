import type { RelationGraph2dLink, RelationGraph2dNode } from "./graphData";

/** 二维关系图节点的同心圆初值坐标。 */
export interface RelationGraph2dLayoutPosition {
  x: number;
  y: number;
  hop: number;
}

const BASE_RING_RADIUS = 118;
const RING_GAP = 96;

/**
 * @description 从种子节点集合出发，按无向边做 BFS，得到每个节点到最近种子的跳数。
 * @param nodeIds 全部节点 id。
 * @param adjacency 无向邻接表。
 * @param seeds 种子节点 id；为空时返回空 Map。
 * @returns 节点 id 到跳数的映射；不可达节点不会出现在结果中。
 */
function computeHopDistances(nodeIds: string[], adjacency: Map<string, string[]>, seeds: string[]): Map<string, number> {
  const hops = new Map<string, number>();
  const queue: string[] = [];

  seeds.forEach((seed) => {
    if (!nodeIds.includes(seed) || hops.has(seed)) return;
    hops.set(seed, 0);
    queue.push(seed);
  });

  while (queue.length) {
    const current = queue.shift()!;
    const currentHop = hops.get(current) ?? 0;
    const neighbors = adjacency.get(current) ?? [];
    neighbors.forEach((neighbor) => {
      if (hops.has(neighbor)) return;
      hops.set(neighbor, currentHop + 1);
      queue.push(neighbor);
    });
  }

  return hops;
}

/**
 * @description 构建无向邻接表，忽略自环与重复端点。
 * @param links 仍以节点 id 表示端点的边列表。
 * @returns 节点 id 到邻居 id 列表的映射。
 */
function buildUndirectedAdjacency(links: Array<Pick<RelationGraph2dLink, "source" | "target">>): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();

  /**
   * @description 向邻接表追加一条有向邻接边，避免重复邻居。
   * @param from 起点。
   * @param to 终点。
   */
  function connect(from: string, to: string): void {
    if (from === to) return;
    const list = adjacency.get(from) ?? [];
    if (!list.includes(to)) list.push(to);
    adjacency.set(from, list);
  }

  links.forEach((link) => {
    connect(link.source, link.target);
    connect(link.target, link.source);
  });

  return adjacency;
}

/**
 * @description 在无种子时选出度数最高的节点作为布局中心；度数相同取字典序更前的 id。
 * @param nodes 节点列表。
 * @returns 中心节点 id；空列表返回空字符串。
 */
function pickMaxDegreeCenter(nodes: RelationGraph2dNode[]): string {
  if (!nodes.length) return "";
  return [...nodes].sort((left, right) => {
    if (right.degree !== left.degree) return right.degree - left.degree;
    return left.id.localeCompare(right.id, "zh-CN");
  })[0]!.id;
}

/**
 * @description 按种子中心与 BFS 跳数生成同心圆初值；同层均匀角分布，半径随 hop 递增。无种子时用最高度数节点作中心。
 * @param nodes 二维关系图节点。
 * @param links 仍以节点 id 表示端点的边。
 * @returns 节点 id 到坐标与跳数的映射。
 */
export function layoutRelationGraph2dPositions(
  nodes: RelationGraph2dNode[],
  links: Array<Pick<RelationGraph2dLink, "source" | "target">>,
): Map<string, RelationGraph2dLayoutPosition> {
  const result = new Map<string, RelationGraph2dLayoutPosition>();
  if (!nodes.length) return result;

  const nodeIds = nodes.map((node) => node.id);
  const adjacency = buildUndirectedAdjacency(links);
  const seedIds = nodes.filter((node) => node.isSeed).map((node) => node.id);
  const centers = seedIds.length ? seedIds : [pickMaxDegreeCenter(nodes)].filter(Boolean);
  const hops = computeHopDistances(nodeIds, adjacency, centers);

  const byHop = new Map<number, string[]>();
  nodeIds.forEach((id) => {
    const hop = hops.get(id);
    if (hop === undefined) {
      const orphanHop = (centers.length ? Math.max(...[...hops.values(), 0]) : 0) + 1;
      const list = byHop.get(orphanHop) ?? [];
      list.push(id);
      byHop.set(orphanHop, list);
      return;
    }
    const list = byHop.get(hop) ?? [];
    list.push(id);
    byHop.set(hop, list);
  });

  byHop.forEach((group, hop) => {
    group.sort((left, right) => left.localeCompare(right, "zh-CN"));
    if (hop === 0) {
      group.forEach((id, index) => {
        if (group.length === 1) {
          result.set(id, { x: 0, y: 0, hop: 0 });
          return;
        }
        const angle = (Math.PI * 2 * index) / group.length - Math.PI / 2;
        const radius = 36;
        result.set(id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, hop: 0 });
      });
      return;
    }

    const radius = BASE_RING_RADIUS + (hop - 1) * RING_GAP;
    group.forEach((id, index) => {
      const angle = group.length === 1 ? -Math.PI / 2 : (Math.PI * 2 * index) / group.length - Math.PI / 2;
      result.set(id, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        hop,
      });
    });
  });

  return result;
}

/** @description 为任务圆环布局按父节点分配事件扇区，避免跨环连线交叉。 @param nodes 图节点。 @param links 有向关系。 @returns 圆环坐标。 */
export function layoutTaskGraphRingPositions(
  nodes: RelationGraph2dNode[],
  links: Array<Pick<RelationGraph2dLink, "source" | "target">>,
): Map<string, RelationGraph2dLayoutPosition> {
  const positions = layoutRelationGraph2dPositions(nodes, links);
  const parents = nodes.filter((node) => positions.get(node.id)?.hop === 1);
  parents.forEach((parent, index) => {
    const angle = (index * Math.PI * 2) / parents.length - Math.PI / 2;
    positions.set(parent.id, { x: Math.cos(angle) * 105, y: Math.sin(angle) * 105, hop: 1 });
    const children = links.filter((link) => link.source === parent.id && positions.get(link.target)?.hop === 2);
    children.forEach((child, childIndex) => {
      const spread = ((Math.PI * 2) / parents.length) * 0.72;
      const childAngle = angle + (children.length > 1 ? (childIndex / (children.length - 1) - 0.5) * spread : 0);
      positions.set(child.target, { x: Math.cos(childAngle) * 225, y: Math.sin(childAngle) * 225, hop: 2 });
    });
  });
  return positions;
}
