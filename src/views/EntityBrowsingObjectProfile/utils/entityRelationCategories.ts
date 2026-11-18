import type { OntologyRelationCategoryTreeNode, OntologyRelationClass, ObjectProfileEntityCategory } from "@/types";

/** @description 将当前实例关系与管理分类中的关系定义按有向对象身份及名称唯一匹配，歧义或缺失时保留未分类。 @param rows 实例关系。 @param root 管理分类树。 @returns 补全真实分类和元数据的实例关系。 */
export function enrichEntityRelationCategories(rows: readonly OntologyRelationClass[], root?: OntologyRelationCategoryTreeNode): OntologyRelationClass[] {
  const definitions: Pick<
    OntologyRelationClass,
    "id" | "categoryId" | "categoryName" | "displayName" | "apiName" | "description" | "sourceOntologyId" | "targetOntologyId"
  >[] = [];
  /** @description 收集分类节点中的关系定义。 @param node 分类节点。 */
  function collectRelationDefinitions(node: OntologyRelationCategoryTreeNode): void {
    for (const link of node.links ?? [])
      definitions.push({
        id: link.uniqueIdentifier,
        categoryId: String(link.categoryId),
        categoryName: findCategoryName(root, String(link.categoryId)) || node.name || "未分类",
        displayName: link.name,
        apiName: link.apiName ?? "",
        description: link.description ?? "",
        sourceOntologyId: link.ontologyUniqueIdentifierFrom,
        targetOntologyId: link.ontologyUniqueIdentifierTo,
      });
    node.children?.forEach(collectRelationDefinitions);
  }
  if (root) collectRelationDefinitions(root);
  return rows.map((row) => {
    const matches = definitions.filter(
      (item) =>
        item.sourceOntologyId === row.sourceOntologyId &&
        item.targetOntologyId === row.targetOntologyId &&
        [item.displayName, item.apiName, item.id].filter(Boolean).includes(row.displayName),
    );
    const unique = [...new Map(matches.map((item) => [item.id, item])).values()];
    const definition = unique.length === 1 ? unique[0] : undefined;
    return {
      ...row,
      categoryId: definition?.categoryId ?? "",
      categoryName: definition?.categoryName ?? "未分类",
      displayName: definition?.displayName || row.displayName,
      apiName: definition?.apiName ?? "",
      description: definition?.description ?? "",
    };
  });
}

/** @description 按真实分类 ID 查找名称。 @param node 分类节点。 @param id 分类 ID。 @returns 名称或空字符串。 */
function findCategoryName(node: OntologyRelationCategoryTreeNode | undefined, id: string): string {
  if (!node) return "";
  if (String(node.categoryId) === id) return node.name ?? "";
  for (const child of node.children ?? []) {
    const name = findCategoryName(child, id);
    if (name) return name;
  }
  return "";
}

/** @description 仅展示当前实例实际使用的分类及祖先，保留管理模块多层级结构。 @param rows 当前实例关系。 @param root 管理分类树。 @returns 浏览分类树。 */
export function buildInstanceRelationCategoryTree(
  rows: readonly OntologyRelationClass[],
  root?: OntologyRelationCategoryTreeNode,
): ObjectProfileEntityCategory[] {
  const used = new Set(rows.map((row) => row.categoryId).filter(Boolean));
  /** @description 裁剪未使用的分类，保留已使用后代的祖先。 @param node 分类节点。 @returns 保留节点或空。 */
  function pruneRelationCategory(node: OntologyRelationCategoryTreeNode): ObjectProfileEntityCategory[] {
    const children = (node.children ?? []).flatMap(pruneRelationCategory);
    return used.has(String(node.categoryId)) || children.length
      ? [{ id: String(node.categoryId), label: node.name || "未命名分类", children, propertyIds: [] }]
      : [];
  }
  const children = root ? (root.children ?? []).flatMap(pruneRelationCategory) : [];
  if (root && used.has(String(root.categoryId)))
    children.unshift({ id: String(root.categoryId), label: root.name || "默认分类", children: [], propertyIds: [] });
  if (rows.some((row) => !row.categoryId)) children.push({ id: "__uncategorized__", label: "未分类", children: [], propertyIds: [] });
  return [{ id: "all", label: "全部关系", propertyIds: [], children }];
}
