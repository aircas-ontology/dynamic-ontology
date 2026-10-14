import type {
  OntologyCategoryTreeData,
  OntologyCategoryTreeNode,
  OntologyConceptNode,
  OntologyObjectItem,
  OntologyObjectQueryItem,
  OntologyObjectSection,
} from "@/types";

/**
 * @description 将单个分类树节点映射为概念层级树节点；同时保留节点下对象显示名称。
 * @param node 接口分类节点。
 * @returns 页面概念树节点。
 */
function mapOntologyCategoryTreeNode(node: OntologyCategoryTreeNode): OntologyConceptNode {
  const id = String(node.categoryId);
  return {
    id,
    label: node.name ?? "",
    count: node.ontologyMetaInfos?.length ?? 0,
    objects: (node.ontologyMetaInfos ?? [])
      .map((meta) => ({ uniqueIdentifier: meta.uniqueIdentifier ?? "", displayName: meta.displayName ?? "" }))
      .filter((item) => Boolean(item.displayName.trim()) && Boolean(item.uniqueIdentifier.trim())),
    targetCategoryId: id,
    children: (node.children ?? []).map(mapOntologyCategoryTreeNode),
  };
}

/**
 * @description 将分类体系树接口单根 data 映射为概念层级树数组（单根包一层）。
 * @param data 接口响应 data。
 * @returns 概念层级树根数组。
 */
export function mapOntologyCategoryTree(data: OntologyCategoryTreeData): OntologyConceptNode[] {
  return [mapOntologyCategoryTreeNode(data)];
}

/**
 * @description 将分类树中的对象元信息映射为对象工作区分区，供对象列表展示和本地创建回显使用。
 * @param data 对象分类树接口数据。
 * @returns 按分类组织的对象工作区分区。
 */
export function mapOntologyCategorySections(data: OntologyCategoryTreeData): OntologyObjectSection[] {
  const sections: OntologyObjectSection[] = [];

  /**
   * @description 递归遍历分类树，有对象的分类写入对象列表分区，包含名为全部的根分类。
   * @param node 当前分类树节点。
   */
  function visit(node: OntologyCategoryTreeNode) {
    const items: OntologyObjectItem[] = (node.ontologyMetaInfos ?? []).map((meta) => ({
      id: meta.uniqueIdentifier,
      categoryId: String(node.categoryId),
      displayName: meta.displayName,
      apiName: meta.apiName,
      description: meta.description ?? "",
      parentDisplayName: meta.parentOntologyDisplayName ?? "无",
      createdAt: meta.createTime,
      iconUrl: meta.icon ?? "",
      metrics: { attribute: meta.propertyCount, relation: meta.relationCount, behavior: meta.actionCount },
    }));
    if (items.length > 0) {
      sections.push({ categoryId: String(node.categoryId), name: node.name ?? `分类 ${node.categoryId}`, items });
    }
    (node.children ?? []).forEach((child) => visit(child));
  }
  visit(data);
  return sections;
}

/**
 * @description 按分类查询结果组装对象列表分区，并使用分类树补充分区名称。
 * @param items 查询接口返回的对象元数据列表。
 * @param tree 已映射的概念层级树。
 * @returns 按对象分类分组的右侧列表分区。
 */
export function mapOntologyObjectSections(items: OntologyObjectQueryItem[], tree: OntologyConceptNode[]): OntologyObjectSection[] {
  const categoryNames = new Map<string, string>();
  const collectCategoryNames = (nodes: OntologyConceptNode[]) => {
    nodes.forEach((node) => {
      categoryNames.set(node.targetCategoryId ?? node.id, node.label || `分类 ${node.id}`);
      collectCategoryNames(node.children);
    });
  };
  collectCategoryNames(tree);

  const sectionItems = new Map<string, OntologyObjectItem[]>();
  items.forEach((meta, index) => {
    const categoryId = String(meta.ontologyCategoryId ?? "");
    if (!categoryId) return;
    const item: OntologyObjectItem = {
      id: meta.uniqueIdentifier ?? `${categoryId}-${index}`,
      categoryId,
      displayName: meta.displayName ?? "未命名对象",
      apiName: meta.apiName ?? "",
      description: meta.description ?? "",
      parentDisplayName: meta.parentOntologyDisplayName ?? "无",
      createdAt: meta.createTime ?? "-",
      iconUrl: meta.icon ?? "",
      metrics: {
        attribute: meta.propertyCount ?? 0,
        relation: meta.relationCount ?? 0,
        behavior: meta.actionCount ?? 0,
      },
    };
    const currentItems = sectionItems.get(categoryId) ?? [];
    currentItems.push(item);
    sectionItems.set(categoryId, currentItems);
  });

  return Array.from(sectionItems, ([categoryId, sectionItems]) => ({
    categoryId,
    name: categoryNames.get(categoryId) ?? `分类 ${categoryId}`,
    items: sectionItems,
  }));
}
