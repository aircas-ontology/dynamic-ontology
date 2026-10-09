import type {
  SpaceBehaviorCategoryNode,
  SpaceBehaviorDeletePreflight,
  SpaceBehaviorItem,
  SpaceBehaviorParameter,
  SpaceBehaviorReferenceCheckResult,
  SpaceBehaviorStatus,
  SpaceBehaviorStatusOperation,
  SpaceBehaviorWorkspaceData,
} from "@/types";

const ROOT_SPACE_BEHAVIOR_CATEGORY_ID = "behavior-root";

/**
 * @description 递归收集分类及其子孙分类 id。
 * @param node 分类节点。
 * @returns 分类 id 列表。
 */
export function collectSpaceBehaviorCategoryIds(node: SpaceBehaviorCategoryNode): string[] {
  return [node.id, ...node.children.flatMap(collectSpaceBehaviorCategoryIds)];
}

/**
 * @description 在分类树中查找指定分类。
 * @param nodes 分类树。
 * @param categoryId 分类 id。
 * @returns 匹配的分类；未找到时返回 null。
 */
export function findSpaceBehaviorCategoryNode(nodes: SpaceBehaviorCategoryNode[], categoryId: string): SpaceBehaviorCategoryNode | null {
  for (const node of nodes) {
    if (node.id === categoryId) return node;
    const found = findSpaceBehaviorCategoryNode(node.children, categoryId);
    if (found) return found;
  }
  return null;
}

/**
 * @description 按分类及其子树筛选行为；根分类或空 id 返回全部。
 * @param behaviors 行为列表。
 * @param categoryTree 分类树。
 * @param categoryId 当前分类 id。
 * @returns 属于该分类子树的行为。
 */
export function filterSpaceBehaviorsByCategory(
  behaviors: SpaceBehaviorItem[],
  categoryTree: SpaceBehaviorCategoryNode[],
  categoryId: string,
): SpaceBehaviorItem[] {
  if (!categoryId || categoryId === ROOT_SPACE_BEHAVIOR_CATEGORY_ID) return behaviors;
  const node = findSpaceBehaviorCategoryNode(categoryTree, categoryId);
  if (!node) return [];
  const ids = new Set(collectSpaceBehaviorCategoryIds(node));
  return behaviors.filter((item) => ids.has(item.categoryId));
}

/**
 * @description 将分类树展平为表单下拉选项。
 * @param nodes 分类树。
 * @returns 分类选项。
 */
export function flattenSpaceBehaviorCategoryOptions(nodes: SpaceBehaviorCategoryNode[]): Array<{ id: string; label: string }> {
  return nodes.flatMap((node) => [{ id: node.id, label: node.label }, ...flattenSpaceBehaviorCategoryOptions(node.children)]);
}

/**
 * @description 按分类子树内的行为数量回写节点 count。
 * @param data 行为工作区数据。
 */
export function recountSpaceBehaviorCategoryCounts(data: SpaceBehaviorWorkspaceData): void {
  /**
   * @description 回写单个分类及其子分类的行为数量。
   * @param node 当前分类。
   * @returns 该子树行为数量。
   */
  function recountNode(node: SpaceBehaviorCategoryNode): number {
    const ownCount = data.behaviors.filter((item) => item.categoryId === node.id).length;
    const childCount = node.children.reduce((total, child) => total + recountNode(child), 0);
    node.count = ownCount + childCount;
    return node.count;
  }
  data.categoryTree.forEach(recountNode);
}

/**
 * @description 按当前状态列出可执行的目标操作。
 * @param status 当前行为状态。
 * @returns 可执行操作列表。
 */
export function listAvailableSpaceBehaviorStatusOperations(status: SpaceBehaviorStatus): SpaceBehaviorStatusOperation[] {
  if (status === "published") return ["disable", "draft"];
  if (status === "draft") return ["publish", "disable"];
  return ["publish", "draft"];
}

/**
 * @description 将目标操作映射为变更后的行为状态。
 * @param operation 目标操作。
 * @returns 变更后的状态。
 */
export function resolveSpaceBehaviorStatusFromOperation(operation: SpaceBehaviorStatusOperation): SpaceBehaviorStatus {
  if (operation === "publish") return "published";
  if (operation === "disable") return "disabled";
  return "draft";
}

/**
 * @description 生成当前 Mock 引用检查结果；本轮固定 0 项且检查通过。
 * @returns 引用检查结果。
 */
export function createEmptySpaceBehaviorReferenceCheck(): SpaceBehaviorReferenceCheckResult {
  return {
    passed: true,
    count: 0,
    summary: "当前无行为树或调度引用。",
  };
}

export interface SpaceBehaviorParameterRow {
  parameter: SpaceBehaviorParameter;
  depth: number;
  isGroup: boolean;
}

/**
 * @description 将参数树复制为普通对象，避免对 Vue 响应式代理执行 structuredClone。
 * @param nodes 参数树。
 * @returns 可安全写入表单的参数副本。
 */
export function cloneSpaceBehaviorParameters(nodes: SpaceBehaviorParameter[]): SpaceBehaviorParameter[] {
  return nodes.map((node) => ({
    id: node.id,
    name: node.name,
    path: node.path,
    type: node.type,
    required: node.required,
    description: node.description,
    sourceLabel: node.sourceLabel,
    bindLabel: node.bindLabel,
    configured: node.configured,
    children: cloneSpaceBehaviorParameters(node.children ?? []),
  }));
}

/**
 * @description 将参数树展平为带缩进的展示行；含子节点的参数作为分组行。
 * @param nodes 参数树。
 * @param depth 当前缩进层级。
 * @returns 参数展示行。
 */
export function flattenSpaceBehaviorParameterRows(nodes: SpaceBehaviorParameter[], depth = 0): SpaceBehaviorParameterRow[] {
  const rows: SpaceBehaviorParameterRow[] = [];
  for (const parameter of nodes) {
    const childNodes = parameter.children ?? [];
    const isGroup = childNodes.length > 0;
    rows.push({ parameter, depth, isGroup });
    if (isGroup) rows.push(...flattenSpaceBehaviorParameterRows(childNodes, depth + 1));
  }
  return rows;
}

/**
 * @description 生成删除预检结果；本轮 Mock 固定无引用且允许删除。
 * @param behaviorName 行为名称。
 * @returns 删除预检。
 */
export function createSpaceBehaviorDeletePreflight(behaviorName: string): SpaceBehaviorDeletePreflight {
  const check = createEmptySpaceBehaviorReferenceCheck();
  return {
    canDelete: check.passed,
    behaviorName,
    impactSummary: check.summary,
    references: [],
  };
}
