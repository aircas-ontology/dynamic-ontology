import type { RuleConditionNode } from "@/types";

/**
 * @description 递归检测条件中已停用的值类型。
 * @param condition 当前条件。
 * @returns 是否含停用类型。
 */
export function hasUnsupportedConditionValue(condition: RuleConditionNode): boolean {
  if (condition.type === "composite") return condition.children.some(hasUnsupportedConditionValue);
  if (condition.type === "monitor") return false;
  return [condition.left, condition.right].some((value) => value.kind !== "input" && value.kind !== "variable");
}

/**
 * @description 校验监测叶子已选择对象与分组。
 * @param condition 当前条件。
 * @returns 首个错误文案。
 */
export function validateMonitorCondition(condition: RuleConditionNode): string {
  if (condition.type === "composite") {
    for (const child of condition.children) {
      const error = validateMonitorCondition(child);
      if (error) return error;
    }
    return "";
  }
  if (condition.type !== "monitor") return "";
  if (!condition.objectId.trim()) return "请选择监测对象";
  if (!condition.storageGroup.trim()) return "请选择存储分组";
  return "";
}
