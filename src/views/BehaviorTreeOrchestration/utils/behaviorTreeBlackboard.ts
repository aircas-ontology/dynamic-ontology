import type { BehaviorTreeBlackboardItem, BehaviorTreeBlackboardSource, BehaviorTreeObjectPropertyOption, BehaviorTreeValueType } from "@/types";
import { BEHAVIOR_TREE_PROPERTY_TYPE_TO_VALUE_TYPE } from "./behaviorTreeConstants.ts";

/**
 * @description 解析黑板键取值来源；缺省时按是否绑定属性推断。
 * @param item 黑板草稿或序列化项。
 * @returns FIXED / EXTERNAL / PROPERTY。
 */
export function resolveBehaviorTreeBlackboardSource(
  item: Pick<BehaviorTreeBlackboardItem, "source" | "bindPropertyUniqueIdentifier"> & { source?: BehaviorTreeBlackboardSource | string | null },
): BehaviorTreeBlackboardSource {
  const raw = typeof item.source === "string" ? item.source.trim() : "";
  if (raw === "FIXED" || raw === "EXTERNAL" || raw === "PROPERTY") return raw;
  return (item.bindPropertyUniqueIdentifier || "").trim() ? "PROPERTY" : "EXTERNAL";
}

/**
 * @description 将对象属性类型映射为黑板值类型。
 * @param propertyType 对象属性 propertyType。
 * @returns 黑板 valueType。
 */
export function mapBehaviorTreePropertyTypeToValueType(propertyType: string | null | undefined): BehaviorTreeValueType {
  const key = String(propertyType ?? "").trim();
  return BEHAVIOR_TREE_PROPERTY_TYPE_TO_VALUE_TYPE[key] || "STRING";
}

/**
 * @description 创建默认外部输入黑板行。
 * @param key 键名。
 * @param overrides 可选覆盖字段。
 * @returns 黑板草稿行。
 */
export function createBehaviorTreeBlackboardItem(key: string, overrides: Partial<BehaviorTreeBlackboardItem> = {}): BehaviorTreeBlackboardItem {
  return {
    key,
    valueType: "STRING",
    source: "EXTERNAL",
    bindPropertyUniqueIdentifier: "",
    fixedValueText: "",
    defaultValueText: "",
    description: "",
    ...overrides,
  };
}

/**
 * @description 切换来源时清空其它来源独占字段。
 * @param item 黑板行。
 * @param source 新来源。
 */
export function applyBehaviorTreeBlackboardSourceChange(item: BehaviorTreeBlackboardItem, source: BehaviorTreeBlackboardSource): void {
  item.source = source;
  if (source !== "PROPERTY") item.bindPropertyUniqueIdentifier = "";
  if (source !== "FIXED") item.fixedValueText = "";
  if (source !== "EXTERNAL") item.defaultValueText = "";
}

/**
 * @description 绑定属性后对齐黑板值类型。
 * @param item 黑板行。
 * @param property 属性目录项。
 */
export function applyBehaviorTreeBlackboardPropertyBinding(
  item: BehaviorTreeBlackboardItem,
  property: BehaviorTreeObjectPropertyOption | null | undefined,
): void {
  item.bindPropertyUniqueIdentifier = property?.id ?? item.bindPropertyUniqueIdentifier;
  if (property) item.valueType = mapBehaviorTreePropertyTypeToValueType(property.propertyType);
}
