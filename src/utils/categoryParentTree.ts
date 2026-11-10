/** 可用于父分类选择的分类树节点。 */
export interface CategoryParentOption {
  id: string;
  label: string;
  children: CategoryParentOption[];
}

/**
 * @description 保留分类层级并移除当前分类及其完整子树，仅输出选择器所需字段。
 * @param nodes 原始分类节点。
 * @param excludedId 正在编辑的分类 id。
 * @returns 不包含当前分类及后代的分类树。
 */
export function buildCategoryParentTree(nodes: readonly CategoryParentOption[], excludedId: string): CategoryParentOption[] {
  return nodes
    .filter((node) => node.id !== excludedId)
    .map((node) => ({ id: node.id, label: node.label, children: buildCategoryParentTree(node.children, excludedId) }));
}
