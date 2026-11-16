import type {
  BehaviorTreeBlackboardItem,
  BehaviorTreeBlackboardSource,
  BehaviorTreeDefinition,
  BehaviorTreeObjectPropertyOption,
  BehaviorTreeValueType,
} from "@/types";
import { behaviorTreeValueToText } from "./behaviorTreeTypedValue.ts";

/**
 * 对象属性 propertyType → 黑板 valueType（与后端 toBlackboardValueType 对齐）。
 */
const BEHAVIOR_TREE_PROPERTY_TYPE_TO_VALUE_TYPE: Record<string, BehaviorTreeValueType> = {
  Bool: "BOOL",
  Int: "INTEGER",
  Long: "LONG",
  Float: "FLOAT",
  Short: "SHORT",
  Byte: "BYTE",
  Double: "DOUBLE",
  Decimal: "DOUBLE",
  Date: "DATE",
  Timestamp: "DATE",
  Array: "LIST",
  Map: "OBJECT",
  Ontology: "OBJECT",
  String: "STRING",
};

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

/**
 * @description 从 treeDefinition 映射黑板草稿行（含 EXTERNAL 默认值）。
 * @param definition 行为树定义。
 * @returns 黑板草稿列表。
 */
export function mapBehaviorTreeDefinitionToBlackboardItems(definition: BehaviorTreeDefinition): BehaviorTreeBlackboardItem[] {
  const variables = Array.isArray(definition.variables) ? definition.variables : [];
  return (definition.blackboard || []).map((item) => {
    const source = resolveBehaviorTreeBlackboardSource({
      source: item.source,
      bindPropertyUniqueIdentifier: item.bindPropertyUniqueIdentifier || "",
    });
    const variable = variables.find((entry) => entry.name === item.key);
    return {
      key: item.key || "",
      valueType: item.valueType || "STRING",
      source,
      bindPropertyUniqueIdentifier: item.bindPropertyUniqueIdentifier || "",
      fixedValueText: source === "FIXED" ? behaviorTreeValueToText(item.value) : "",
      defaultValueText: source === "EXTERNAL" && variable ? behaviorTreeValueToText(variable.defaultValue) : "",
      description: item.description || "",
    };
  });
}
