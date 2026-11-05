import type { OntologyEntityRowDetailVO, OntologyEntityRowPropertyGroupData } from "@/types";

/** 测试弹窗可选的实体属性数据行。 */
export interface BehaviorTestEntityDataRow {
  rowKey: string;
  storageGroup: string;
  dataPrimaryKey: string | number | boolean | Record<string, unknown>;
  dataPrimaryKeyLabel: string;
  propertySummary: string;
}

/**
 * @description 规范化存储分组名，便于同组比较。
 * @param value 原始分组。
 * @returns 去空白后的分组名。
 */
function normalizeStorageGroupName(value: string | undefined | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @description 将未知主键格式化为展示文案。
 * @param value 主键值。
 * @returns 展示文案。
 */
function formatDataPrimaryKeyLabel(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * @description 汇总数据行属性为短文案。
 * @param row 分组数据行。
 * @returns 摘要。
 */
function buildDataRowPropertySummary(row: OntologyEntityRowPropertyGroupData): string {
  const props = Array.isArray(row.props) ? row.props : [];
  const entries = props
    .slice(0, 3)
    .map((item) => {
      const name = (item.propertyDisplayName || item.propertyApiName || "").trim() || "属性";
      return `${name}=${formatDataPrimaryKeyLabel(item.propertyValue)}`;
    })
    .filter(Boolean);
  if (entries.length) return entries.join("；");
  return props.length ? `${props.length} 项属性` : "—";
}

/**
 * @description 判断 dataPrimaryKey 是否可作为提交值。
 * @param value 原始主键。
 * @returns 可提交时返回收敛后的值；否则 null。
 */
function resolveDataPrimaryKey(value: unknown): string | number | boolean | Record<string, unknown> | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "object") return value as Record<string, unknown>;
  return String(value);
}

/**
 * @description 将实体行详情扁平为可单选的数据行列表；可按行为存储分组过滤。
 * @param detail 行详情；为空时返回空列表。
 * @param storageGroupFilter 行为详情中的存储分组；空字符串表示不过滤（调用方应先校验）。
 * @returns 数据行列表。
 */
export function mapOntologyEntityRowDetailToDataRows(
  detail: OntologyEntityRowDetailVO | null | undefined,
  storageGroupFilter = "",
): BehaviorTestEntityDataRow[] {
  if (!detail || !Array.isArray(detail.propertyGroups)) return [];
  const targetGroup = normalizeStorageGroupName(storageGroupFilter);
  const rows: BehaviorTestEntityDataRow[] = [];
  detail.propertyGroups.forEach((group, groupIndex) => {
    const storageGroup = normalizeStorageGroupName(group.storageGroup) || "—";
    if (targetGroup && normalizeStorageGroupName(storageGroup) !== targetGroup) return;
    const groupDataList = Array.isArray(group.groupDataList) ? group.groupDataList : [];
    groupDataList.forEach((item, rowIndex) => {
      const dataPrimaryKey = resolveDataPrimaryKey(item.dataPrimaryKey);
      if (dataPrimaryKey === null) return;
      rows.push({
        rowKey: `${storageGroup}-${formatDataPrimaryKeyLabel(dataPrimaryKey)}-${groupIndex}-${rowIndex}`,
        storageGroup,
        dataPrimaryKey,
        dataPrimaryKeyLabel: formatDataPrimaryKeyLabel(dataPrimaryKey),
        propertySummary: buildDataRowPropertySummary(item),
      });
    });
  });
  return rows;
}
