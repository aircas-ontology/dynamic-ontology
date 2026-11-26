import type { RuleConditionMonitorType } from "@/types";

/**
 * @description 判断变量属性是否需要再选子表数据行。
 * @param storageGroup 属性存储分组。
 * @returns 非空且非 main 时为 true。
 */
export function needsRuleVariableDataRow(storageGroup: string | undefined): boolean {
  const group = typeof storageGroup === "string" ? storageGroup.trim() : "";
  return Boolean(group) && group !== "main";
}

/** 条件变量在配置参数中的绑定需求。 */
export interface RuleVariableBindingRequirement {
  /** 是否需要选择对象实例。 */
  requiresInstance: boolean;
  /** 是否需要选择子表数据行。 */
  requiresDataRow: boolean;
}

/**
 * @description 按监测事件与存储分组计算实例/数据行绑定需求。
 * `insert`/`delete`：主表无需实例与数据行；子表仅需实例。其余场景主表需实例，子表需实例与数据行。
 * @param storageGroup 属性存储分组。
 * @param monitorType 组级监测事件类型。
 * @returns 绑定需求。
 */
export function readRuleVariableBindingRequirement(
  storageGroup: string | undefined,
  monitorType?: RuleConditionMonitorType | null,
): RuleVariableBindingRequirement {
  const isSubTable = needsRuleVariableDataRow(storageGroup);
  if (monitorType === "insert" || monitorType === "delete") {
    return { requiresInstance: isSubTable, requiresDataRow: false };
  }
  return { requiresInstance: true, requiresDataRow: isSubTable };
}
