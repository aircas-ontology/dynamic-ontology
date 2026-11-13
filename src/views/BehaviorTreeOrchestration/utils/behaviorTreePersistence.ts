import type { BehaviorTreeDefinition, GetOntologyActionInfoData } from "@/types";

/**
 * @description 根据是否已持久化决定创建或更新所用 HTTP 方法。
 * @param hasPersisted 是否已存在后端记录。
 * @returns POST 或 PUT。
 */
export function resolveBehaviorTreeSaveMethod(hasPersisted: boolean): "POST" | "PUT" {
  return hasPersisted ? "PUT" : "POST";
}

/**
 * @description 从行为详情中提取并校验 TREE 的 treeDefinition。
 * @param detail 行为详情。
 * @returns 行为树定义。
 */
export function extractBehaviorTreeDefinitionFromDetail(detail: GetOntologyActionInfoData): BehaviorTreeDefinition {
  if (detail.actionKind && detail.actionKind !== "TREE") {
    throw new Error(`该 api 不是行为树，actionKind=${detail.actionKind}`);
  }
  if (!detail.treeDefinition) {
    throw new Error("该行为没有 treeDefinition");
  }
  return detail.treeDefinition;
}
