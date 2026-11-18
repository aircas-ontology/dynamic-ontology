import type { OntologyCategoryTreeData, OntologyCategoryTreeNode } from "@/types";

/** 带所属分类目录的对象下拉选项。 */
export interface OntologyCategoryObjectOption {
  value: string;
  label: string;
  /** 所属分类节点 categoryId（同一目录约束键）。 */
  categoryId: number;
}

/** 对象分类树选择节点（分类不可选，对象叶子可选）。 */
export interface OntologyCategorySelectTreeNode {
  id: string;
  label: string;
  disabled?: boolean;
  /** 对象叶子所属目录；分类节点为空。 */
  categoryId?: number;
  children?: OntologyCategorySelectTreeNode[];
}

/**
 * @description 构造分类节点 id，避免与对象 uniqueIdentifier 冲突。
 * @param categoryId 分类 id。
 * @returns 树节点 id。
 */
export function resolveOntologyCategoryTreeNodeId(categoryId: number): string {
  return `cat:${categoryId}`;
}

/**
 * @description 从对象分类树收集对象选项，目录键取挂载节点的 categoryId。
 * @param data 对象分类体系树根节点。
 * @returns 去重后的对象选项，按中文名称排序。
 */
export function mapOntologyObjectsToCategoryOptions(data: OntologyCategoryTreeData): OntologyCategoryObjectOption[] {
  const options = new Map<string, OntologyCategoryObjectOption>();

  /**
   * @description 递归遍历分类节点并收集对象。
   * @param node 当前分类节点。
   */
  function visitOntologyCategoryNode(node: OntologyCategoryTreeNode): void {
    const categoryId = node.categoryId;
    for (const meta of node.ontologyMetaInfos ?? []) {
      const value = meta.uniqueIdentifier?.trim() ?? "";
      const label = meta.displayName?.trim() || value;
      if (!value || options.has(value)) continue;
      options.set(value, { value, label, categoryId });
    }
    for (const child of node.children ?? []) {
      visitOntologyCategoryNode(child);
    }
  }

  visitOntologyCategoryNode(data);
  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label, "zh-CN") || a.value.localeCompare(b.value));
}

/**
 * @description 将对象分类树映射为 tree-select 节点（保留目录层级；空目录剪枝）。
 * @param data 对象分类体系树根节点。
 * @returns 树根节点列表。
 */
export function mapOntologyCategoryTreeToSelectNodes(data: OntologyCategoryTreeData): OntologyCategorySelectTreeNode[] {
  /**
   * @description 映射单个分类节点；无对象且无有效子目录时返回 null。
   * @param node 分类节点。
   * @returns 树节点；应剪枝时为 null。
   */
  function visitOntologyCategoryNode(node: OntologyCategoryTreeNode): OntologyCategorySelectTreeNode | null {
    const categoryId = node.categoryId;
    const objectLeaves: OntologyCategorySelectTreeNode[] = [];
    const seen = new Set<string>();
    for (const meta of node.ontologyMetaInfos ?? []) {
      const id = meta.uniqueIdentifier?.trim() ?? "";
      const label = meta.displayName?.trim() || id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      objectLeaves.push({ id, label, categoryId, disabled: false });
    }
    objectLeaves.sort((a, b) => a.label.localeCompare(b.label, "zh-CN") || a.id.localeCompare(b.id));
    const childCategories = (node.children ?? [])
      .map((child) => visitOntologyCategoryNode(child))
      .filter((item): item is OntologyCategorySelectTreeNode => item != null);
    if (!objectLeaves.length && !childCategories.length) return null;
    return {
      id: resolveOntologyCategoryTreeNodeId(categoryId),
      label: (node.name || "").trim() || `分类 ${categoryId}`,
      disabled: true,
      children: [...objectLeaves, ...childCategories],
    };
  }

  const root = visitOntologyCategoryNode(data);
  return root ? [root] : [];
}

/**
 * @description 按已选目录刷新树节点禁用态：分类始终禁用；跨目录对象禁用。
 * @param nodes 原始树节点。
 * @param selectedCategoryId 已选对象所属目录；未选时为 null。
 * @returns 带禁用态的新树。
 */
export function applyOntologyCategorySelectTreeDisabled(
  nodes: OntologyCategorySelectTreeNode[],
  selectedCategoryId: number | null,
): OntologyCategorySelectTreeNode[] {
  return nodes.map((node) => {
    const isCategory = node.categoryId == null;
    const children = node.children ? applyOntologyCategorySelectTreeDisabled(node.children, selectedCategoryId) : undefined;
    if (isCategory) {
      return { ...node, disabled: true, children };
    }
    const disabled = selectedCategoryId != null && node.categoryId !== selectedCategoryId;
    return { ...node, disabled, children };
  });
}
