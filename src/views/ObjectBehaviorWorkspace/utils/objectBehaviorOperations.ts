import type { SpaceBehaviorCategoryNode, SpaceBehaviorItem, SpaceBehaviorStatus, SpaceBehaviorStatusOperation } from "@/types";
import { ROOT_SPACE_BEHAVIOR_CATEGORY_ID } from "@/types";

/**
 * @description 收集分类节点和全部后代节点的标识。
 * @param node 分类节点。
 * @returns 分类标识列表。
 */
export function collectObjectBehaviorCategoryIds(node: SpaceBehaviorCategoryNode): string[] {
  return [node.id, ...node.children.flatMap(collectObjectBehaviorCategoryIds)];
}

/**
 * @description 在对象行为分类树中查找节点。
 * @param nodes 分类节点列表。
 * @param categoryId 分类标识。
 * @returns 对应分类；未找到时返回 null。
 */
export function findObjectBehaviorCategoryNode(nodes: SpaceBehaviorCategoryNode[], categoryId: string): SpaceBehaviorCategoryNode | null {
  for (const node of nodes) {
    if (node.id === categoryId) return node;
    const result = findObjectBehaviorCategoryNode(node.children, categoryId);
    if (result) return result;
  }
  return null;
}

/**
 * @description 用选中分类及其子分类筛选对象行为。
 * @param behaviors 全部行为。
 * @param categoryTree 分类树。
 * @param categoryId 当前分类标识。
 * @returns 分类范围内的行为。
 */
export function filterObjectBehaviorsByCategory(
  behaviors: SpaceBehaviorItem[],
  categoryTree: SpaceBehaviorCategoryNode[],
  categoryId: string,
): SpaceBehaviorItem[] {
  if (!categoryId || categoryId === ROOT_SPACE_BEHAVIOR_CATEGORY_ID) return behaviors;
  const category = findObjectBehaviorCategoryNode(categoryTree, categoryId);
  if (!category) return [];
  const ids = new Set(collectObjectBehaviorCategoryIds(category));
  return behaviors.filter((item) => ids.has(item.categoryId));
}

/**
 * @description 将分类树转换为下拉选项。
 * @param nodes 分类节点列表。
 * @returns 分类下拉选项。
 */
export function flattenObjectBehaviorCategoryOptions(nodes: SpaceBehaviorCategoryNode[]): Array<{ id: string; label: string }> {
  return nodes.flatMap((node) => [{ id: node.id, label: node.label }, ...flattenObjectBehaviorCategoryOptions(node.children)]);
}

/**
 * @description 按当前状态获取可执行的状态迁移。
 * @param status 当前行为状态。
 * @returns 可执行的目标操作。
 */
export function listObjectBehaviorStatusOperations(status: SpaceBehaviorStatus): SpaceBehaviorStatusOperation[] {
  if (status === "published") return ["disable", "draft"];
  if (status === "draft") return ["publish", "disable"];
  return ["publish", "draft"];
}
