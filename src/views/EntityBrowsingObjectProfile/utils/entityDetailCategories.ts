import type { ActionCategoryVO, ObjectProfileEntityCategory, OntologyRelationClass } from "@/types";

/** @description 按分类筛选当前实例关系，全部入口返回副本。 @param items 实例关系。 @param categoryId 分类标识。 @param tree 分类树，用于包含后代分类。 @returns 选中关系。 */
export function filterEntityRelations(
  items: readonly OntologyRelationClass[],
  categoryId: string,
  tree: ObjectProfileEntityCategory[] = [],
): OntologyRelationClass[] {
  const ids = new Set([categoryId]);
  /** @description 收集所选分类的后代 ID。 @param nodes 分类节点。 @param selected 祖先是否选中。 */
  function collectCategoryIds(nodes: ObjectProfileEntityCategory[], selected = false): void {
    nodes.forEach((node) => {
      const included = selected || node.id === categoryId;
      if (included) ids.add(node.id);
      collectCategoryIds(node.children, included);
    });
  }
  collectCategoryIds(tree);
  return items.filter((item) => categoryId === "all" || ids.has(item.categoryId || "__uncategorized__"));
}

/** @description 将行为分类协议转换为只读分类节点，兼容旧 items 容器并去除行为管理叶子。 @param data 接口分类树。 @returns 全部行为入口与分类。 */
export function mapEntityBehaviorCategories(data: ActionCategoryVO | ActionCategoryVO[]): ObjectProfileEntityCategory[] {
  /** @description 转换单个真实分类，缺失身份时明确拒绝。 @param node 原分类。 @returns 浏览分类。 */
  function mapBehaviorCategory(node: ActionCategoryVO): ObjectProfileEntityCategory {
    const id = node.id ?? node.categoryId;
    const label = node.name ?? node.categoryName;
    if (id === undefined || !label?.trim()) throw new Error("行为分类数据缺少标识或名称");
    const legacy = Array.isArray(node.items) ? node.items : node.items ? [node.items] : [];
    return { id: String(id), label, propertyIds: [], children: [...(node.children ?? []), ...legacy].map(mapBehaviorCategory) };
  }
  const roots = (Array.isArray(data) ? data : [data]).map(mapBehaviorCategory);
  return [{ id: "all", label: "全部行为", propertyIds: [], children: roots.length === 1 ? (roots[0]?.children ?? []) : roots }];
}
