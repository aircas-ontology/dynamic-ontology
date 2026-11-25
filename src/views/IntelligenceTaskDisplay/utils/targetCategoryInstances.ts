import type { OntologyCategoryTreeNode, OntologyEntityQueryData } from "@/types";

/** 目标列表中展示的实例项。 */
export interface TargetCategoryItem {
  id: string;
  name: string;
}

/**
 * @description 递归收集分类及其子分类绑定的对象唯一标识，并保持首次出现顺序。
 * @param category 分类树节点。
 * @returns 去重后的对象唯一标识列表。
 */
export function collectCategoryOntologyIdentifiers(category: OntologyCategoryTreeNode): string[] {
  const identifiers = new Set<string>();

  /** @description 将当前节点及其子节点的对象唯一标识写入集合。 @param node 当前分类节点。 */
  function collectNodeIdentifiers(node: OntologyCategoryTreeNode): void {
    node.ontologyMetaInfos?.forEach((metaInfo) => {
      const identifier = metaInfo.uniqueIdentifier.trim();
      if (identifier) identifiers.add(identifier);
    });
    node.children?.forEach(collectNodeIdentifiers);
  }

  collectNodeIdentifiers(category);
  return [...identifiers];
}

/**
 * @description 将对象实例查询响应展平为目标列表展示项。
 * @param groups 按对象分组的实例查询响应数据。
 * @returns 以对象标识和实例主键组成稳定标识的目标列表项。
 */
export function buildTargetCategoryItems(groups: OntologyEntityQueryData): TargetCategoryItem[] {
  return groups.flatMap((group) =>
    group.entityList.map((entity) => {
      const name = entity.displayName.trim() || `${entity.ontologyName || group.ontologyUniqueIdentifier} ${String(entity.primaryKey)}`;
      return { id: `${group.ontologyUniqueIdentifier}:${String(entity.primaryKey)}`, name };
    }),
  );
}
