import type { OntologyCategoryTreeData, OntologyCategoryTreeNode, OntologyConceptNode } from "@/types";

/**
 * @description 将单个分类树节点映射为概念层级树节点；缺 name 用空串，count 为本节点 meta 条数。
 * @param node 接口分类节点。
 * @returns 页面概念树节点。
 */
function mapOntologyCategoryTreeNode(node: OntologyCategoryTreeNode): OntologyConceptNode {
  const id = String(node.categoryId);
  return {
    id,
    label: node.name ?? "",
    count: node.ontologyMetaInfos?.length ?? 0,
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
