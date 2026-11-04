import type { GetOntologyObjectArrTypeTreeData, OntologyPropertyInfo } from "@/types";

/**
 * @description 从对象属性分类树递归收集 propertyInfos，按 uniqueIdentifier 去重。
 * @param root 属性分类树根节点；为空时返回空数组。
 * @returns 去重后的属性信息列表，保持首次出现顺序。
 */
export function flattenPropertyInfosFromCategoryTree(root: GetOntologyObjectArrTypeTreeData | null | undefined): OntologyPropertyInfo[] {
  if (!root) return [];
  const rows = new Map<string, OntologyPropertyInfo>();

  /**
   * @description 遍历分类节点及其子节点，收集属性信息。
   * @param node 当前分类节点。
   */
  function visitCategoryNode(node: GetOntologyObjectArrTypeTreeData): void {
    for (const property of node.propertyInfos ?? []) {
      const id = typeof property.uniqueIdentifier === "string" ? property.uniqueIdentifier.trim() : "";
      if (!id || rows.has(id)) continue;
      rows.set(id, property);
    }
    for (const child of node.children ?? []) {
      visitCategoryNode(child);
    }
  }

  visitCategoryNode(root);
  return [...rows.values()];
}
