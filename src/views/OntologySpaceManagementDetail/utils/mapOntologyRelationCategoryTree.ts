import type {
  OntologyRelationCategoryLink,
  OntologyRelationCategoryNode,
  OntologyRelationCategoryTreeData,
  OntologyRelationCategoryTreeNode,
  OntologyRelationClass,
} from "@/types";

/**
 * @description 将单个关系分类树节点映射为页面关系分类节点；缺 name 用空串。
 * @param node 接口关系分类节点。
 * @returns 页面关系分类树节点。
 */
function mapOntologyRelationCategoryTreeNode(node: OntologyRelationCategoryTreeNode): OntologyRelationCategoryNode {
  return {
    id: String(node.categoryId),
    label: node.name ?? "",
    children: (node.children ?? []).map(mapOntologyRelationCategoryTreeNode),
  };
}

/**
 * @description 将关系分类体系树接口单根 data 映射为页面关系分类树数组（单根包一层）。
 * @param data 接口响应 data。
 * @returns 关系分类树根数组。
 */
export function mapOntologyRelationCategoryTree(data: OntologyRelationCategoryTreeData): OntologyRelationCategoryNode[] {
  return [mapOntologyRelationCategoryTreeNode(data)];
}

/**
 * @description 将单条关系链接映射为页面关系类；缺省字段用空串，cardinality 用一对多占位。
 * @param link 接口 links 项。
 * @returns 页面关系类。
 */
function mapOntologyRelationLink(link: OntologyRelationCategoryLink): OntologyRelationClass {
  return {
    id: link.uniqueIdentifier,
    categoryId: String(link.categoryId),
    categoryName: "",
    displayName: link.name ?? "",
    apiName: "",
    sourceName: link.ontologyNameFrom ?? "",
    targetName: link.ontologyNameTo ?? "",
    cardinality: "一对多",
    description: "",
  };
}

/**
 * @description 递归收集关系分类树各节点 links，按 uniqueIdentifier 去重后映射为页面关系列表。
 * @param data 接口关系分类树单根 data。
 * @returns 去重后的关系类数组。
 */
export function mapOntologyRelationLinks(data: OntologyRelationCategoryTreeData): OntologyRelationClass[] {
  const relations = new Map<string, OntologyRelationClass>();

  /**
   * @description 遍历分类节点，收集当前节点及子节点下的关系链接。
   * @param node 当前分类节点。
   */
  function visitOntologyRelationCategoryNode(node: OntologyRelationCategoryTreeNode): void {
    for (const link of node.links ?? []) {
      const id = link.uniqueIdentifier?.trim() ?? "";
      if (!id || relations.has(id)) continue;
      relations.set(id, mapOntologyRelationLink(link));
    }
    for (const child of node.children ?? []) {
      visitOntologyRelationCategoryNode(child);
    }
  }

  visitOntologyRelationCategoryNode(data);
  return [...relations.values()];
}
