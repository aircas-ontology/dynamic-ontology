import type {
  GetOntologyObjectArrTypeTreeData,
  OntologyAttributeCategoryNode,
  OntologyAttributeItem,
  OntologyAttributePropertyTreeNode,
  OntologyAttributeTreeNode,
  OntologyPropertyInfo,
} from "@/types";

/**
 * @description 将接口分类树节点及其属性转换为属性页树节点。
 * @param node 接口返回的分类树节点
 * @returns 页面分类树节点
 */
export function mapCategoryTreeNode(node: GetOntologyObjectArrTypeTreeData): OntologyAttributeCategoryNode {
  const categoryChildren = node.children?.map((child) => mapCategoryTreeNode(child)) ?? [];
  const propertyChildren = (node.propertyInfos ?? []).map(mapPropertyTreeNode);
  const children: OntologyAttributeTreeNode[] = [...categoryChildren, ...propertyChildren];
  return {
    nodeType: "category",
    id: String(node.categoryId),
    label: node.name || "未命名分类",
    propertyCount: propertyChildren.length,
    isRoot: node.categoryId === 0,
    children: children.length ? children : undefined,
  };
}

/** @description 将接口属性转换为分类树中的属性节点。 */
function mapPropertyTreeNode(item: OntologyPropertyInfo): OntologyAttributePropertyTreeNode {
  const label = item.displayName || item.apiName || "未命名属性";
  const identifier = item.uniqueIdentifier?.trim();
  return {
    nodeType: "property",
    id: `property:${identifier || `${item.categoryId ?? ""}:${label}`}`,
    label,
    source: item,
  };
}

/**
 * @description 将接口属性记录适配为属性列表项。
 * @param item 接口属性记录
 * @param ontologyUniqueIdentifier 当前本体对象标识
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
    dataType: item.propertyType ?? metadataDataType,
    categoryId: item.categoryId === undefined ? "" : String(item.categoryId),
    storageGroup: item.storageGroup ?? "",
    defaultValue: item.defaultValue ?? "",
    description: item.description ?? "",
    isPrimary: item.isPrimaryKey === true,
    isNameKey: item.isTitleKey === true,
  };
}

/** @description 将服务端存储分组显示名称转换为表单使用的存储分组值。 */
export function normalizeStorageGroupValue(value: string): string {
  return value === "主存储" ? "main" : value;
}

/** @description 判断树节点是否为属性分类节点。 */
export function isCategoryNode(value: OntologyAttributeTreeNode): value is OntologyAttributeCategoryNode {
  return value.nodeType === "category";
}

/** @description 递归查找指定分类节点。 */
export function findCategory(nodes: OntologyAttributeTreeNode[], id: string): OntologyAttributeCategoryNode | undefined {
  for (const node of nodes) {
    if (!isCategoryNode(node)) continue;
    if (node.id === id) return node;
    const found = node.children ? findCategory(node.children, id) : undefined;
    if (found) return found;
  }
  return undefined;
}

/**
 * @description 查找属性分类树中的根分类 id。
 * @param nodes 属性分类节点。
 * @returns 根分类 id；树中没有根分类时返回空字符串。
 */
export function findRootCategoryId(nodes: OntologyAttributeCategoryNode[]): string {
  for (const node of nodes) {
    if (node.isRoot || node.id === "0") return node.id;
    const nested = findRootCategoryId(node.children?.filter(isCategoryNode) ?? []);
    if (nested) return nested;
  }
  return "";
}

/**
 * @description 取属性分类下拉的第一项。
 * @param nodes 属性分类节点。
 * @returns 第一项分类 id；没有分类时返回空字符串。
 */
export function findFirstCategoryId(nodes: OntologyAttributeCategoryNode[]): string {
  return flattenCategoryOptions(nodes)[0]?.id ?? "";
}

/**
 * @description 决定属性表单的分类：已有分类保持不变，否则选中下拉第一项。
 * @param nodes 属性分类节点。
 * @param currentCategoryId 当前属性分类 id。
 * @returns 表单应选中的分类 id。
 */
export function resolveAttributeFormCategoryId(nodes: OntologyAttributeCategoryNode[], currentCategoryId = ""): string {
  const current = currentCategoryId.trim();
  if (current) return current;
  return findFirstCategoryId(nodes);
}

/**
 * @description 将属性表单分类 id 转为接口数字，根分类 0 会保留。
 * @param categoryId 表单中的分类 id。
 * @returns 非负整数分类 id；空白或无法解析时返回 undefined。
 */
export function parseAttributeCategoryId(categoryId: string): number | undefined {
  if (!categoryId.trim()) return undefined;
  const parsed = Number(categoryId);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

/** @description 将分类树扁平化为属性表单分类选项。 */
export function flattenCategoryOptions(nodes: OntologyAttributeCategoryNode[]): OntologyAttributeCategoryNode[] {
  return nodes.flatMap((node) => {
    const categoryChildren = node.children?.filter(isCategoryNode) ?? [];
    return [node, ...flattenCategoryOptions(categoryChildren)];
  });
}

/** @description 查找分类节点的父分类。 */
export function findCategoryParent(
  nodes: OntologyAttributeTreeNode[],
  id: string,
  parent?: OntologyAttributeCategoryNode,
): OntologyAttributeCategoryNode | undefined {
  for (const node of nodes) {
    if (!isCategoryNode(node)) continue;
    if (node.id === id) return parent;
    const found = node.children ? findCategoryParent(node.children, id, node) : undefined;
    if (found) return found;
  }
  return undefined;
}

/** @description 根据分类搜索词过滤树节点。 */
export function filterCategoryNode(value: string, data: unknown): boolean {
  if (!data || typeof data !== "object" || !("label" in data) || typeof data.label !== "string") return false;
  return !value.trim() || data.label.includes(value.trim());
}

/** @description 判断表格行是否符合属性数据结构。 */
export function isAttributeItem(value: unknown): value is OntologyAttributeItem {
  if (!value || typeof value !== "object") return false;
  return "uniqueIdentifier" in value && typeof value.uniqueIdentifier === "string";
}

/** 属性主键或名称键。 */
export type AttributeKeyKind = "primary" | "name";

/** 参与主键和名称键冲突判断的属性。 */
export interface AttributeKeyOwner {
  uniqueIdentifier: string;
  displayName: string;
  apiName: string;
  isPrimary: boolean;
  isNameKey: boolean;
}

/**
 * @description 查找当前对象里已经占用主键或名称键的其他属性。
 * @param attributes 当前对象的全部属性。
 * @param kind 要设置的键类型。
 * @param editingAttributeId 正在编辑的属性标识；新增时为空。
 * @returns 已占用该键的其他属性；没有冲突时返回 null。
 */
export function findConflictingAttributeKey(
  attributes: AttributeKeyOwner[],
  kind: AttributeKeyKind,
  editingAttributeId: string | null,
): AttributeKeyOwner | null {
  return (
    attributes.find((item) => {
      if (editingAttributeId && item.uniqueIdentifier === editingAttributeId) return false;
      return kind === "primary" ? item.isPrimary : item.isNameKey;
    }) ?? null
  );
}

/**
 * @description 生成主键或名称键重复时的提示文案。
 * @param kind 冲突的键类型。
 * @param attribute 已经占用该键的属性。
 * @returns 提示用户不能再设置第二个主键或名称键。
 */
export function formatAttributeKeyConflictMessage(kind: AttributeKeyKind, attribute: Pick<AttributeKeyOwner, "displayName" | "apiName">): string {
  const name = attribute.displayName.trim() || attribute.apiName.trim() || "未命名属性";
  const label = kind === "primary" ? "主键" : "名称键";
  return `当前对象已存在${label}「${name}」，不能同时设置两个${label}`;
}

/** @description 递归收集分类节点及其子分类中的属性。 */
export function collectPropertyItemsFromTree(nodes: OntologyAttributeTreeNode[], ontologyUniqueIdentifier: string): OntologyAttributeItem[] {
  const items: OntologyAttributeItem[] = [];
  for (const node of nodes) {
    if (node.nodeType === "property") {
      items.push(mapOntologyPropertyItem(node.source, ontologyUniqueIdentifier));
    } else if (node.children?.length) {
      items.push(...collectPropertyItemsFromTree(node.children, ontologyUniqueIdentifier));
    }
  }
  return items;
}
