import type { BehaviorTreeKindMeta, BehaviorTreeModel, BehaviorTreeNodeConfigDraft, BehaviorTreeNodeDraft, BehaviorTreeNodeKind } from "@/types";
import { BEHAVIOR_TREE_NODE_H, BEHAVIOR_TREE_NODE_W } from "./behaviorTreeConstants.ts";

/**
 * @description 深度遍历树节点。
 * @param nodes 节点列表。
 * @param visit 访问回调。
 */
export function forEachBehaviorTreeNode(nodes: BehaviorTreeNodeDraft[], visit: (node: BehaviorTreeNodeDraft) => void): void {
  for (const node of nodes) {
    visit(node);
    forEachBehaviorTreeNode(node.children, visit);
  }
}

/**
 * @description 按 id 查找节点。
 * @param roots 根列表。
 * @param id 节点 id。
 * @returns 节点或 null。
 */
export function findBehaviorTreeNode(roots: BehaviorTreeNodeDraft[], id: string | null | undefined): BehaviorTreeNodeDraft | null {
  if (!id) return null;
  let found: BehaviorTreeNodeDraft | null = null;
  forEachBehaviorTreeNode(roots, (node) => {
    if (node.id === id) found = node;
  });
  return found;
}

/**
 * @description 查找父节点。
 * @param roots 根列表。
 * @param id 子节点 id。
 * @returns 父节点或 null。
 */
export function findBehaviorTreeParent(roots: BehaviorTreeNodeDraft[], id: string): BehaviorTreeNodeDraft | null {
  let found: BehaviorTreeNodeDraft | null = null;
  forEachBehaviorTreeNode(roots, (node) => {
    if (!found && node.children.some((child) => child.id === id)) found = node;
  });
  return found;
}

/**
 * @description 判断子树是否包含目标 id。
 * @param node 子树根。
 * @param id 目标 id。
 * @returns 包含时为 true。
 */
export function behaviorTreeSubtreeContains(node: BehaviorTreeNodeDraft | null, id: string): boolean {
  if (!node) return false;
  if (node.id === id) return true;
  return node.children.some((child) => behaviorTreeSubtreeContains(child, id));
}

/**
 * @description 生成下一节点 id。
 * @param roots 当前根。
 * @param seq 序号引用。
 * @returns 新 id。
 */
export function nextBehaviorTreeNodeId(roots: BehaviorTreeNodeDraft[], seq: { value: number }): string {
  let id = "";
  do {
    id = `node_${seq.value++}`;
  } while (findBehaviorTreeNode(roots, id));
  return id;
}

/**
 * @description 判断 child 能否挂到 parent 下。
 * @param roots 根列表。
 * @param kindMeta kind 元信息表。
 * @param parentId 父 id。
 * @param childId 子 id；新增时可空。
 * @returns 可挂载时为 true。
 */
export function canAttachBehaviorTreeChild(
  roots: BehaviorTreeNodeDraft[],
  kindMeta: Record<BehaviorTreeNodeKind, BehaviorTreeKindMeta>,
  parentId: string,
  childId: string | null,
): boolean {
  const parent = findBehaviorTreeNode(roots, parentId);
  if (!parent) return false;
  const parentMeta = kindMeta[parent.kind];
  if (parentMeta.category === "LEAF") return false;
  if (parentMeta.category === "DECORATOR" && parent.children.length >= 1) return false;
  if (childId) {
    const child = findBehaviorTreeNode(roots, childId);
    if (!child || childId === parentId) return false;
    if (behaviorTreeSubtreeContains(child, parentId)) return false;
    if (parent.children.some((item) => item.id === childId)) return false;
  }
  return true;
}

/**
 * @description 从树中移除节点（不销毁对象）。
 * @param model 模型。
 * @param id 节点 id。
 */
export function removeBehaviorTreeNodeFromTree(model: BehaviorTreeModel, id: string): void {
  const parent = findBehaviorTreeParent(model.roots, id);
  if (parent) {
    parent.children = parent.children.filter((child) => child.id !== id);
    return;
  }
  model.roots = model.roots.filter((root) => root.id !== id);
}

/**
 * @description 将节点挂到新父节点下。
 * @param model 模型。
 * @param id 移动节点。
 * @param targetId 目标父节点。
 * @returns 是否成功。
 */
export function reparentBehaviorTreeNode(model: BehaviorTreeModel, id: string, targetId: string): boolean {
  const moving = findBehaviorTreeNode(model.roots, id);
  const target = findBehaviorTreeNode(model.roots, targetId);
  if (!moving || !target) return false;
  removeBehaviorTreeNodeFromTree(model, id);
  target.children.push(moving);
  return true;
}

/**
 * @description 按 kind 生成默认配置草稿。
 * @param kind 节点 kind。
 * @returns 配置草稿。
 */
export function createDefaultBehaviorTreeConfig(kind: BehaviorTreeNodeKind): BehaviorTreeNodeConfigDraft | null {
  switch (kind) {
    case "SELECTOR":
    case "SEQUENCE":
      return { runMode: "STANDARD" };
    case "PARALLEL":
      return { policy: "ALL_SUCCESS", maxConcurrency: "" };
    case "REPEATER":
      return { loopMode: "FIXED_TIMES", times: "3" };
    case "UNTIL_SUCCESS":
    case "UNTIL_FAILURE":
      return { maxTimes: "0", finishState: "FAILURE" };
    case "COOLDOWN":
      return { intervalSeconds: "30", entityPrimaryKeyKey: "", hitResult: "FAILURE" };
    case "TIME_LIMIT":
      return { limitSeconds: "30", timeoutState: "FAILURE" };
    case "BLACKBOARD_CONDITION":
      return { key: "", op: "EQ", value: "" };
    case "CONDITION":
      return { expression: "" };
    case "ACTION":
      return { actionApi: "", timeoutSeconds: "", retryTimes: "" };
    default:
      return null;
  }
}

/**
 * @description 计算新增节点落点。
 * @param anchor 锚点节点。
 * @param point 画布局部坐标。
 * @returns 左上角坐标。
 */
export function placeOfNewBehaviorTreeNode(anchor: BehaviorTreeNodeDraft | null, point: { x: number; y: number } | null): { x: number; y: number } {
  if (point) {
    return {
      x: Math.max(0, Math.round(point.x - BEHAVIOR_TREE_NODE_W / 2)),
      y: Math.max(0, Math.round(point.y - BEHAVIOR_TREE_NODE_H / 2)),
    };
  }
  if (anchor && typeof anchor._x === "number" && typeof anchor._y === "number") {
    return { x: anchor._x + 24, y: anchor._y + BEHAVIOR_TREE_NODE_H + 34 };
  }
  return { x: 60, y: 60 };
}

/**
 * @description 创建空行为树模型。
 * @returns 空模型。
 */
export function createEmptyBehaviorTreeModel(): BehaviorTreeModel {
  return { blackboard: [], roots: [] };
}

/**
 * @description 调整同级子节点顺序。
 * @param model 模型。
 * @param parentId 父 id。
 * @param childId 子 id。
 * @param delta 位移。
 */
export function reorderBehaviorTreeChild(model: BehaviorTreeModel, parentId: string, childId: string, delta: number): void {
  const parent = findBehaviorTreeNode(model.roots, parentId);
  if (!parent) return;
  const index = parent.children.findIndex((child) => child.id === childId);
  const next = index + delta;
  if (index < 0 || next < 0 || next >= parent.children.length) return;
  const [item] = parent.children.splice(index, 1);
  if (!item) return;
  parent.children.splice(next, 0, item);
}

/**
 * @description 黑板键重命名时同步节点引用。
 * @param roots 根列表。
 * @param oldKey 旧键。
 * @param newKey 新键。
 */
export function renameBehaviorTreeKeyRefs(roots: BehaviorTreeNodeDraft[], oldKey: string, newKey: string): void {
  if (!oldKey || !newKey || oldKey === newKey) return;
  forEachBehaviorTreeNode(roots, (node) => {
    const config = node.config;
    if (!config) return;
    if (node.kind === "BLACKBOARD_CONDITION" && config.key === oldKey) config.key = newKey;
    if (node.kind === "COOLDOWN" && config.entityPrimaryKeyKey === oldKey) config.entityPrimaryKeyKey = newKey;
  });
}
