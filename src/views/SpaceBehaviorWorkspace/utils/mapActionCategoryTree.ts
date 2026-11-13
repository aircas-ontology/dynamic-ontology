import type { ActionCategoryActionInfo, ActionCategoryVO, SpaceBehaviorCategoryNode } from "@/types";

/** 行为分类树映射可选过滤条件。 */
export interface MapActionCategoryTreeOptions {
  /** 对象唯一标识；有值时仅保留匹配的行为叶子。 */
  ontologyUniqIdentifier?: string;
}

/**
 * @description 读取分类节点 id；兼容 id / categoryId。
 * @param node 接口分类节点。
 * @returns 分类 id；缺失时为 undefined。
 */
function readActionCategoryNodeId(node: ActionCategoryVO): number | undefined {
  return node.id ?? node.categoryId;
}

/**
 * @description 读取分类节点名称；兼容 name / categoryName。
 * @param node 接口分类节点。
 * @returns 分类名称；缺失时为空串。
 */
function readActionCategoryNodeName(node: ActionCategoryVO): string {
  return (node.name ?? node.categoryName ?? "").trim();
}

/**
 * @description 判断行为摘要是否属于指定对象；未指定对象时全部保留。
 * @param info 行为摘要。
 * @param ontologyUniqIdentifier 对象唯一标识。
 * @returns 应保留时为 true。
 */
function matchActionCategoryActionOntology(info: ActionCategoryActionInfo, ontologyUniqIdentifier: string): boolean {
  if (!ontologyUniqIdentifier) return true;
  return (info.ontologyUniqIdentifier ?? "").trim() === ontologyUniqIdentifier;
}

/**
 * @description 将接口行为摘要映射为分类树行为叶子。
 * @param categoryId 所属分类 id。
 * @param info 行为摘要。
 * @returns 行为叶子节点。
 */
function mapActionCategoryActionLeaf(categoryId: string, info: ActionCategoryActionInfo): SpaceBehaviorCategoryNode {
  const actionApi = info.actionApi.trim();
  const displayName = info.displayName.trim() || actionApi;
  return {
    id: `action:${categoryId}:${actionApi}`,
    label: displayName,
    kind: "action",
    parentCategoryId: categoryId,
    actionApi,
    count: 0,
    children: [],
  };
}

/**
 * @description 将行为分类树接口节点映射为工作区分类节点，并按 actionInfos 累计 count、挂载行为叶子。
 * @param node 接口返回的行为分类节点。
 * @param options 可选过滤条件。
 * @returns 工作区分类节点。
 */
export function mapActionCategoryNode(node: ActionCategoryVO, options: MapActionCategoryTreeOptions = {}): SpaceBehaviorCategoryNode {
  const nodeId = readActionCategoryNodeId(node);
  const nodeName = readActionCategoryNodeName(node);
  if (nodeId === undefined || !nodeName) {
    throw new Error("行为分类树返回数据缺少节点 id 或名称");
  }
  const ontologyUniqIdentifier = (options.ontologyUniqIdentifier ?? "").trim();
  const categoryId = String(nodeId);
  const childCategories = (node.children ?? []).map((child) => mapActionCategoryNode(child, options));
  const legacyItemChildren = Array.isArray(node.items) ? node.items : node.items ? [node.items] : [];
  const legacyCategories = legacyItemChildren
    .filter((item) => readActionCategoryNodeId(item) !== undefined && readActionCategoryNodeName(item))
    .map((item) => mapActionCategoryNode(item, options));
  const actionLeaves = (node.actionInfos ?? [])
    .filter((info) => typeof info.actionApi === "string" && info.actionApi.trim())
    .filter((info) => matchActionCategoryActionOntology(info, ontologyUniqIdentifier))
    .map((info) => mapActionCategoryActionLeaf(categoryId, info));
  const categoryChildren = [...childCategories, ...legacyCategories];
  return {
    id: categoryId,
    label: nodeName,
    kind: "category",
    count: actionLeaves.length + categoryChildren.reduce((total, child) => total + child.count, 0),
    children: [...categoryChildren, ...actionLeaves],
  };
}

/**
 * @description 将接口返回的单节点或节点数组统一映射为工作区分类树。
 * @param data 接口返回的分类数据。
 * @param options 可选过滤条件；有 ontologyUniqIdentifier 时仅保留该对象下的行为叶子。
 * @returns 工作区分类树。
 */
export function mapActionCategoryTree(data: ActionCategoryVO | ActionCategoryVO[], options: MapActionCategoryTreeOptions = {}): SpaceBehaviorCategoryNode[] {
  const nodes = Array.isArray(data) ? data : [data];
  const firstNode = nodes[0];
  const container = firstNode && nodes.length === 1 && firstNode.id === undefined && firstNode.categoryId === undefined ? firstNode : undefined;
  const children = container?.items ?? container?.children ?? nodes;
  return (Array.isArray(children) ? children : [children]).map((child) => mapActionCategoryNode(child, options));
}
