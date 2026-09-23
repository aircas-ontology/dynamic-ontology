import type { SubspaceCreateSelectedObject } from "./mapSubspaceCreateSelectedObject";

export interface SubspaceCreateSelectedRelation {
  id: string;
  displayName: string;
  sourceLabel: string;
  targetLabel: string;
}

const subspaceCreateRelationCatalog = [
  { key: "escort", displayName: "护航" },
  { key: "formation", displayName: "同编队" },
] as const;

/**
 * @description 按已选对象两两生成可纳入子空间的关系行。
 * @param objects 第一步勾选的本体对象。
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
