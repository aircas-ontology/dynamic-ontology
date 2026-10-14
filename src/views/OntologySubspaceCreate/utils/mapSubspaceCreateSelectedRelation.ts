import type { SubspaceCreateSelectedObject } from "./mapSubspaceCreateSelectedObject";
import type { OntologyRelationCategoryTreeData } from "@/types";

export interface SubspaceCreateSelectedRelation {
  id: string;
  displayName: string;
  sourceLabel: string;
  targetLabel: string;
  apiName?: string;
  type?: string;
  description?: string;
}

/**
 * @description 将父空间关系分类树中的关系链接映射为子空间关系行，并保留已选对象之间的关系。
 * @param data 父空间关系分类树数据。
 * @param objects 子空间已选对象。
 * @returns 来源和目标对象均已选中的关系行。
 */
export function mapSubspaceCreateRelationsFromTree(
  data: OntologyRelationCategoryTreeData | null | undefined,
  objects: SubspaceCreateSelectedObject[],
): SubspaceCreateSelectedRelation[] {
  if (!data || !objects.length) return [];
  const selectedObjectIds = new Set(objects.map((object) => object.id));
  const objectLabels = new Map(objects.map((object) => [object.id, object.label]));
  const rows = new Map<string, SubspaceCreateSelectedRelation>();

  /**
   * @description 遍历关系分类树并收集关系链接。
   * @param node 当前关系分类树节点。
   */
  function visitRelationTreeNode(node: OntologyRelationCategoryTreeData) {
    for (const link of node.links ?? []) {
      const sourceId = link.ontologyUniqueIdentifierFrom;
      const targetId = link.ontologyUniqueIdentifierTo;
      if (!selectedObjectIds.has(sourceId) || !selectedObjectIds.has(targetId)) continue;
      const id = link.uniqueIdentifier?.trim() || `${sourceId}-${targetId}-${link.apiName || link.name}`;
      if (rows.has(id)) continue;
      const row: SubspaceCreateSelectedRelation = {
        id,
        displayName: link.name || link.apiName || "未命名关系",
        sourceLabel: objectLabels.get(sourceId) || link.ontologyNameFrom || sourceId,
        targetLabel: objectLabels.get(targetId) || link.ontologyNameTo || targetId,
      };
      if (link.apiName !== undefined) row.apiName = link.apiName;
      if (link.type !== undefined) row.type = link.type;
      if (link.description !== undefined) row.description = link.description;
      rows.set(id, row);
    }
    for (const child of node.children ?? []) visitRelationTreeNode(child);
  }

  visitRelationTreeNode(data);
  return [...rows.values()];
}

const subspaceCreateRelationCatalog = [
  { key: "escort", displayName: "护航" },
  { key: "formation", displayName: "同编队" },
] as const;

/**
 * @description 按已选对象两两生成可纳入子空间的关系行。
 * @param objects 第一步勾选的对象。
 * @returns 关系表格行。
 */
export function mapSubspaceCreateSelectedRelations(objects: SubspaceCreateSelectedObject[]): SubspaceCreateSelectedRelation[] {
  const pairs: Array<{ source: SubspaceCreateSelectedObject; target: SubspaceCreateSelectedObject }> = [];
  for (let sourceIndex = 0; sourceIndex < objects.length; sourceIndex += 1) {
    for (let targetIndex = sourceIndex + 1; targetIndex < objects.length; targetIndex += 1) {
      const source = objects[sourceIndex];
      const target = objects[targetIndex];
      if (source && target) {
        pairs.push({ source, target });
      }
    }
  }
  const onlyObject = objects[0];
  if (pairs.length === 0 && onlyObject) {
    pairs.push({ source: onlyObject, target: onlyObject });
  }
  return pairs.flatMap(({ source, target }) =>
    subspaceCreateRelationCatalog.map((item) => ({
      id: `${source.id}-${target.id}-${item.key}`,
      displayName: item.displayName,
      sourceLabel: source.label,
      targetLabel: target.label,
    })),
  );
}
