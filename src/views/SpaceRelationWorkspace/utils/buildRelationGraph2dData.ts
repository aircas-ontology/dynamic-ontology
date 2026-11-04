import type { OntologyRelationClass } from "@/types";

/** 二维关系图节点。 */
export interface RelationGraph2dNode {
  id: string;
  label: string;
  isSeed: boolean;
  degree: number;
}

/** 二维关系图边。 */
export interface RelationGraph2dLink {
  id: string;
  source: string;
  target: string;
  relationId: string;
  label: string;
  categoryName: string;
}

/** 二维关系图数据。 */
export interface RelationGraph2dData {
  nodes: RelationGraph2dNode[];
  links: RelationGraph2dLink[];
}

/**
 * @description 将空间关系列表转换为二维力导向图节点与有向边；忽略空白端点，按种子名标记中心节点并统计度数。
 * @param relations 可见关系列表。
 * @param seedNames 中心对象名称集合。
 * @returns 去重后的节点与边数据。
 */
export function buildRelationGraph2dData(relations: OntologyRelationClass[], seedNames: string[]): RelationGraph2dData {
  const seeds = new Set(seedNames.map((name) => name.trim()).filter(Boolean));
  const degree = new Map<string, number>();
  const links: RelationGraph2dLink[] = [];

  relations.forEach((relation) => {
    const source = relation.sourceName.trim();
    const target = relation.targetName.trim();
    if (!source || !target) return;

    degree.set(source, (degree.get(source) ?? 0) + 1);
    degree.set(target, (degree.get(target) ?? 0) + 1);
    links.push({
      id: `link-${relation.id}`,
      source,
      target,
      relationId: relation.id,
      label: relation.displayName.trim() || relation.apiName.trim() || "关系",
      categoryName: relation.categoryName.trim(),
    });
  });

  const nodes: RelationGraph2dNode[] = [...degree.keys()].map((id) => ({
    id,
    label: id,
    isSeed: seeds.has(id),
    degree: degree.get(id) ?? 0,
  }));

  return { nodes, links };
}

/**
 * @description 将边的 source/target 从节点 id 绑定为同一批节点对象引用，供 D3 forceLink 直接使用，避免对字符串写入 vx。
 * @param nodes 仿真节点列表。
 * @param links 仍以节点 id 表示端点的边列表。
 * @returns 端点已替换为节点对象的边列表；找不到端点的边会被丢弃。
 */
export function bindRelationGraph2dLinkNodes<TNode extends { id: string }, TLink extends { source: string; target: string }>(
  nodes: TNode[],
  links: TLink[],
): Array<Omit<TLink, "source" | "target"> & { source: TNode; target: TNode }> {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const bound: Array<Omit<TLink, "source" | "target"> & { source: TNode; target: TNode }> = [];

  links.forEach((link) => {
    const source = nodeById.get(link.source);
    const target = nodeById.get(link.target);
    if (!source || !target) return;
    bound.push({
      ...link,
      source,
      target,
    });
  });

  return bound;
}
