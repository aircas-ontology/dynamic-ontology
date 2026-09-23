export type SubspaceCreatePropertyFilterKind = "text" | "number" | "dateRange" | "dateTimeRange" | "boolean";

/**
 * @description 按属性数据类型选择筛选条件控件。
 * @param dataType 属性数据类型。
 * @returns 筛选控件类型。
 */
export function resolveSubspaceCreatePropertyFilterKind(dataType: string): SubspaceCreatePropertyFilterKind {
  const normalized = dataType.trim().toLowerCase();
  if (normalized === "datetime" || normalized === "timestamp") {
    return "dateTimeRange";
  }
  if (normalized === "date") {
    return "dateRange";
  }
  if (["double", "float", "integer", "int", "long", "number", "decimal"].includes(normalized)) {
    return "number";
  }
  if (normalized === "boolean" || normalized === "bool") {
    return "boolean";
  }
  return "text";
}
