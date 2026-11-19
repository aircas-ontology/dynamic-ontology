import type { SpaceBehaviorCategoryNode } from "@/types";

/** 与空间行为根分类 id 保持一致，避免测试运行时解析 `@/` 值导入。 */
const ROOT_BROWSE_BEHAVIOR_CATEGORY_ID = "behavior-root";

/**
 * @description 从分类树中去掉行为叶子，供浏览分类面板仅展示可筛选分类。
 * @param nodes 含行为叶子的分类树。
 * @returns 仅含分类节点的树副本。
 */
export function omitBrowseActionLeaves(nodes: SpaceBehaviorCategoryNode[]): SpaceBehaviorCategoryNode[] {
  return nodes
    .filter((node) => node.kind !== "action")
    .map((node) => ({
      ...node,
      children: omitBrowseActionLeaves(node.children),
    }));
}

/**
 * @description 在分类树中查找指定分类。
 * @param nodes 分类树。
 * @param categoryId 分类 id。
 * @returns 匹配的分类；未找到时返回 null。
 */
export function findBrowseBehaviorCategoryNode(nodes: SpaceBehaviorCategoryNode[], categoryId: string): SpaceBehaviorCategoryNode | null {
  for (const node of nodes) {
    if (node.id === categoryId) return node;
    const found = findBrowseBehaviorCategoryNode(node.children, categoryId);
    if (found) return found;
  }
  return null;
}

/**
 * @description 将选中分类解析为列表查询 categoryId；根分类或不合法 id 时不传。
 * @param categoryId 当前选中分类 id。
 * @param tree 分类树。
 * @returns 数字 categoryId；根或无效时为 undefined。
 */
export function resolveBrowseListCategoryIdQuery(categoryId: string, tree: SpaceBehaviorCategoryNode[]): number | undefined {
  const id = categoryId.trim();
  if (!id || id === ROOT_BROWSE_BEHAVIOR_CATEGORY_ID) return undefined;
  if (tree[0]?.id === id) return undefined;
  const numericCategoryId = Number(id);
  if (!Number.isInteger(numericCategoryId)) return undefined;
  return numericCategoryId;
}

/**
 * @description 递归收集分类节点 id，供树默认展开。
 * @param nodes 分类树。
 * @returns 分类 id 列表。
 */
export function collectBrowseCategoryIds(nodes: SpaceBehaviorCategoryNode[]): string[] {
  return nodes.flatMap((node) => {
    if (node.kind === "action") return [];
    return [node.id, ...collectBrowseCategoryIds(node.children)];
  });
}
