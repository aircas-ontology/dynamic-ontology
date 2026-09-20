import type { OntologyRelationCategoryNode, OntologyRelationCategoryTreeData, OntologyRelationCategoryTreeNode } from "@/types";

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
