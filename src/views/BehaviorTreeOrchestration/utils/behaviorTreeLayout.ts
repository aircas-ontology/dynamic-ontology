import type { BehaviorTreeNodeDraft } from "@/types";
import { BEHAVIOR_TREE_H_GAP, BEHAVIOR_TREE_NODE_H, BEHAVIOR_TREE_NODE_W, BEHAVIOR_TREE_V_GAP } from "./behaviorTreeConstants.ts";

/**
 * @description 测量子树宽度。
 * @param node 节点。
 * @returns 宽度。
 */
function measureBehaviorTreeNode(node: BehaviorTreeNodeDraft): number {
  if (!node.children.length) {
    node._w = BEHAVIOR_TREE_NODE_W;
    return BEHAVIOR_TREE_NODE_W;
  }
  const width = node.children.reduce((sum, child) => sum + measureBehaviorTreeNode(child), 0) + BEHAVIOR_TREE_H_GAP * (node.children.length - 1);
  node._w = Math.max(BEHAVIOR_TREE_NODE_W, width);
  return node._w;
}

/**
 * @description 放置节点坐标。
 * @param node 节点。
 * @param left 左边界。
 * @param depth 深度。
 */
function placeBehaviorTreeNode(node: BehaviorTreeNodeDraft, left: number, depth: number): void {
  const width = node._w ?? BEHAVIOR_TREE_NODE_W;
  node._x = left + (width - BEHAVIOR_TREE_NODE_W) / 2;
  node._y = 40 + depth * (BEHAVIOR_TREE_NODE_H + BEHAVIOR_TREE_V_GAP);
  let cursor = left;
  node.children.forEach((child) => {
    placeBehaviorTreeNode(child, cursor, depth + 1);
    cursor += (child._w ?? BEHAVIOR_TREE_NODE_W) + BEHAVIOR_TREE_H_GAP;
  });
}

/**
 * @description 对模型根节点执行自动布局。
 * @param roots 根列表。
 */
export function layoutBehaviorTreeRoots(roots: BehaviorTreeNodeDraft[]): void {
  let left = 40;
  roots.forEach((root) => {
    measureBehaviorTreeNode(root);
    placeBehaviorTreeNode(root, left, 0);
    left += (root._w ?? BEHAVIOR_TREE_NODE_W) + 60;
  });
}
