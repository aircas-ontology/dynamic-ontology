import type { OntologyCategoryTreeData, OntologyCategoryTreeNode, SpaceRelationObjectOption } from "@/types";

/**
 * @description 从对象分类树递归收集本体对象，按 uniqueIdentifier 去重并生成关系表单可选列表。
 * @param data 对象分类体系树单根节点。
 * @returns 源/目标本体下拉选项（value 为 uniqueIdentifier，label 为 displayName），按中文名称排序。
 */
export function mapOntologyObjectsToRelationOptions(data: OntologyCategoryTreeData): SpaceRelationObjectOption[] {
  const options = new Map<string, SpaceRelationObjectOption>();

  /**
   * @description 遍历分类节点，收集当前节点及子节点下的本体元信息。
   * @param node 当前分类节点。
   */
  function visitOntologyCategoryNode(node: OntologyCategoryTreeNode): void {
    for (const meta of node.ontologyMetaInfos ?? []) {
      const value = meta.uniqueIdentifier?.trim() ?? "";
      const label = meta.displayName?.trim() || value;
      if (!value || options.has(value)) continue;
      options.set(value, { value, label });
    }
    for (const child of node.children ?? []) {
      visitOntologyCategoryNode(child);
    }
  }

  visitOntologyCategoryNode(data);
  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label, "zh-CN") || a.value.localeCompare(b.value));
}
