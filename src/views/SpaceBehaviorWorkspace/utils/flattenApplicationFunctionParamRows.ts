import type { GetOntologyFunctionDetailParamItem } from "@/types";

/** 应用行为入出参表格行。 */
export interface ApplicationFunctionParamRow {
  /** 行唯一键。 */
  rowKey: string;
  /** 顶层函数参数 id；子字段复用顶层 id。 */
  functionParamId: number | null;
  /** 展示用参数名。 */
  paramName: string;
  /** 相对路径，如 position.longitude；顶层为空。 */
  paramPath: string;
  /** 完整路径，如 pos.position.longitude。 */
  fullPath: string;
  /** 原始 paramType。 */
  paramType: string;
  /** 中文类型标签。 */
  typeLabel: string;
  /** 嵌套深度，0 为顶层。 */
  depth: number;
  /** 是否对象类型（可含子字段）。 */
  isObject: boolean;
  /** 是否有子字段行。 */
  hasChildren: boolean;
}

/**
 * @description 将接口 paramType 映射为列表展示用中文标签。
 * @param paramType 原始类型。
 * @returns 中文标签；未知类型回退原值或「未知」。
 */
export function mapFunctionParamTypeLabel(paramType: string): string {
  const normalized = paramType.trim().toUpperCase();
  if (!normalized) return "未知";
  if (normalized === "OBJECT" || normalized === "MAP") return "对象";
  if (normalized === "LIST" || normalized === "ARRAY") return "列表";
  if (normalized === "STRING") return "字符串";
  if (normalized === "INTEGER" || normalized === "INT" || normalized === "LONG") return "整数";
  if (normalized === "DOUBLE" || normalized === "FLOAT" || normalized === "NUMBER" || normalized === "DECIMAL") return "数值";
  if (normalized === "BOOLEAN" || normalized === "BOOL") return "布尔";
  return paramType.trim() || "未知";
}

/**
 * @description 判断参数类型是否视为对象结构。
 * @param paramType 原始类型。
 * @returns 对象类型时为 true。
 */
function isObjectParamType(paramType: string): boolean {
  const normalized = paramType.trim().toUpperCase();
  return normalized === "OBJECT" || normalized === "MAP";
}

/**
 * @description 递归展开详情参数树为表格行。
 * @param items 参数节点。
 * @param category 目标 category（INPUT / OUTPUT）。
 * @param parentPath 父级相对路径。
 * @param parentFullPath 父级完整路径。
 * @param inheritedParamId 顶层 paramId。
 * @param depth 当前深度。
 * @param filterTopLevelCategory 是否仅在顶层过滤 category。
 * @returns 扁平表格行。
 */
function flattenParamItems(
  items: GetOntologyFunctionDetailParamItem[],
  category: "INPUT" | "OUTPUT",
  parentPath: string,
  parentFullPath: string,
  inheritedParamId: number | null,
  depth: number,
  filterTopLevelCategory: boolean,
): ApplicationFunctionParamRow[] {
  const sortable = [...items].sort((left, right) => {
    const leftOrder = typeof left.paramOrder === "number" && Number.isFinite(left.paramOrder) ? left.paramOrder : Number.MAX_SAFE_INTEGER;
    const rightOrder = typeof right.paramOrder === "number" && Number.isFinite(right.paramOrder) ? right.paramOrder : Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return (left.paramName ?? "").localeCompare(right.paramName ?? "", "zh-CN");
  });
  const rows: ApplicationFunctionParamRow[] = [];
  for (const item of sortable) {
    if (filterTopLevelCategory) {
      const itemCategory = typeof item.category === "string" ? item.category.trim().toUpperCase() : "";
      if (itemCategory !== category) continue;
    }
    const paramName = typeof item.paramName === "string" ? item.paramName.trim() : "";
    if (!paramName) continue;
    const paramType = typeof item.paramType === "string" ? item.paramType.trim() : "";
    const functionParamId = typeof item.paramId === "number" && Number.isInteger(item.paramId) ? item.paramId : inheritedParamId;
    const paramPath = parentPath ? `${parentPath}.${paramName}` : "";
    const fullPath = parentFullPath ? `${parentFullPath}.${paramName}` : paramName;
    const childFields = Array.isArray(item.fields) ? item.fields : [];
    const hasChildren = childFields.length > 0;
    rows.push({
      rowKey: `${category}:${fullPath}`,
      functionParamId,
      paramName,
      paramPath,
      fullPath,
      paramType,
      typeLabel: mapFunctionParamTypeLabel(paramType),
      depth,
      isObject: isObjectParamType(paramType) || hasChildren,
      hasChildren,
    });
    if (hasChildren) {
      rows.push(...flattenParamItems(childFields, category, paramPath || paramName, fullPath, functionParamId, depth + 1, false));
    }
  }
  return rows;
}

/**
 * @description 从函数详情 params 生成应用行为入参表格行（含对象子字段）。
 * @param params 详情 params。
 * @returns 入参行列表。
 */
export function flattenApplicationFunctionInputRows(params: GetOntologyFunctionDetailParamItem[]): ApplicationFunctionParamRow[] {
  return flattenParamItems(params, "INPUT", "", "", null, 0, true);
}

/**
 * @description 从函数详情 params 生成应用行为出参表格行（含对象子字段）。
 * @param params 详情 params。
 * @returns 出参行列表。
 */
export function flattenApplicationFunctionOutputRows(params: GetOntologyFunctionDetailParamItem[]): ApplicationFunctionParamRow[] {
  return flattenParamItems(params, "OUTPUT", "", "", null, 0, true);
}
