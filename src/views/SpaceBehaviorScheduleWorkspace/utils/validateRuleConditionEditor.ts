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
 * @description 拦截仍为旧监测叶子（仅对象+分组）的条件树，提示改为比较同构表单后再保存。
 * @param condition 当前条件。
 * @returns 首个错误文案；无问题为空串。
 */
export function validateMonitorCondition(condition: RuleConditionNode): string {
  if (condition.type === "composite") {
    for (const child of condition.children) {
      const error = validateMonitorCondition(child);
      if (error) return error;
    }
    return "";
  }
  if (condition.type === "monitor") return "请将监测条件改为属性比较表单后再保存";
  return "";
}
