import type { GetOntologyObjectArrTypeTreeData, OntologyAttributeCategoryNode, OntologyAttributeItem, OntologyPropertyInfo } from "@/types";

/**
 * @description 将接口分类树节点适配为属性页树节点。
 * @param node 接口返回的分类树节点
 * @param attributes 当前已加载的属性列表，用于叶子节点计数
 * @returns 页面分类树节点
 */
export function mapCategoryTreeNode(node: GetOntologyObjectArrTypeTreeData, attributes: OntologyAttributeItem[]): OntologyAttributeCategoryNode {
  const children = node.children?.map((child) => mapCategoryTreeNode(child, attributes));
  return {
    id: String(node.categoryId),
    label: node.name || "未命名分类",
    count: children?.reduce((total, child) => total + child.count, 0) ?? attributes.filter((item) => item.categoryId === String(node.categoryId)).length,
    isRoot: true,
    children: children?.length ? children : undefined,
  };
}

/**
 * @description 将接口属性记录适配为属性页列表项。
 * @param item 接口属性记录
 * @param ontologyUniqueIdentifier 当前本体对象标识，接口缺省时回退使用
 * @returns 属性列表项
 */
export function mapOntologyPropertyItem(item: OntologyPropertyInfo, ontologyUniqueIdentifier: string): OntologyAttributeItem {
  const metadataApiName = typeof item.metadata?.apiName === "string" ? item.metadata.apiName : "";
  const metadataDataType = typeof item.metadata?.dataType === "string" ? item.metadata.dataType : "";
  return {
    uniqueIdentifier: item.uniqueIdentifier ?? "",
    ontologyUniqueIdentifier: item.ontologyUniqueIdentifier ?? ontologyUniqueIdentifier,
    displayName: item.displayName ?? "",
    apiName: item.apiName ?? metadataApiName,
    dataType: item.dataType ?? metadataDataType,
    categoryId: item.categoryId === undefined ? "" : String(item.categoryId),
    storageGroup: item.storageGroup ?? "",
    defaultValue: item.defaultValue ?? "",
    description: item.description ?? "",
    isPrimary: item.isPrimaryKey === true,
    isNameKey: item.isTitleKey === true,
  };
}

/**
 * @description 将服务端存储分组显示名称转换为表单使用的存储分组值。
 * @param value 服务端存储分组
 * @returns 表单存储分组值
 */
export function normalizeStorageGroupValue(value: string): string {
  return value === "主存储" ? "main" : value;
}

/**
 * @description 在分类树中递归查找指定节点。
 * @param nodes 分类树
 * @param id 节点 id
 * @returns 匹配节点或 undefined
 */
export function findCategory(nodes: OntologyAttributeCategoryNode[], id: string): OntologyAttributeCategoryNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = node.children ? findCategory(node.children, id) : undefined;
    if (found) return found;
  }
  return undefined;
}

/**
 * @description 将属性分类树扁平化为属性表单下拉选项。
 * @param nodes 分类树
 * @returns 扁平分类列表
 */
export function flattenCategoryOptions(nodes: OntologyAttributeCategoryNode[]): OntologyAttributeCategoryNode[] {
  return nodes.flatMap((node) => [node, ...(node.children ? flattenCategoryOptions(node.children) : [])]);
}

/**
 * @description 查找分类节点的父分类。
 * @param nodes 分类树
 * @param id 目标节点 id
 * @param parent 当前递归父节点
 * @returns 父节点或 undefined
 */
export function findCategoryParent(
  nodes: OntologyAttributeCategoryNode[],
  id: string,
  parent?: OntologyAttributeCategoryNode,
): OntologyAttributeCategoryNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return parent;
    const found = node.children ? findCategoryParent(node.children, id, node) : undefined;
    if (found) return found;
  }
  return undefined;
}

/**
 * @description 根据分类搜索词过滤树节点。
 * @param value 搜索词
 * @param data 树节点数据
 * @returns 是否保留该节点
 */
export function filterCategoryNode(value: string, data: unknown): boolean {
  if (!data || typeof data !== "object" || !("label" in data) || typeof data.label !== "string") return false;
  return !value.trim() || data.label.includes(value.trim());
}

/**
 * @description 判断表格行是否符合属性数据结构。
 * @param value 待校验值
 * @returns 是否为属性列表项
 */
export function isAttributeItem(value: unknown): value is OntologyAttributeItem {
  if (!value || typeof value !== "object") return false;
  return "uniqueIdentifier" in value && typeof value.uniqueIdentifier === "string";
}
