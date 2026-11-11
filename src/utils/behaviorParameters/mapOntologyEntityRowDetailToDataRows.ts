import type {
  OntologyEntityRowDetailPageData,
  OntologyEntityRowDetailPageRecord,
  OntologyEntityRowDetailVO,
  OntologyEntityRowPropertyGroupData,
} from "@/types";
import type { BehaviorTestEntityDataRow } from "@/types";
export type { BehaviorTestEntityDataRow } from "@/types";

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

/**
 * @description 统计分页属性行的属性个数文案。
 * @param row 分页属性行记录。
 * @returns 属性个数（字符串）。
 */
function buildPageDataRowPropertyCount(row: OntologyEntityRowDetailPageRecord): string {
  const props = Array.isArray(row.props) ? row.props : [];
  return String(props.length);
}

/**
 * @description 将属性行分页 records 映射为可单选的数据行列表。
 * @param pageData 分页响应 data；为空时返回空列表。
 * @param storageGroup 请求侧存储分组（响应该字段不返回）。
 * @returns 数据行列表。
 */
export function mapOntologyEntityRowDetailPageToDataRows(
  pageData: OntologyEntityRowDetailPageData | null | undefined,
  storageGroup: string,
): BehaviorTestEntityDataRow[] {
  if (!pageData || !Array.isArray(pageData.records)) return [];
  const normalizedStorageGroup = normalizeStorageGroupName(storageGroup) || "—";
  const rows: BehaviorTestEntityDataRow[] = [];
  pageData.records.forEach((item, rowIndex) => {
    const dataPrimaryKey = resolveDataPrimaryKey(item.dataPrimaryKey);
    if (dataPrimaryKey === null) return;
    rows.push({
      rowKey: `${normalizedStorageGroup}-${formatDataPrimaryKeyLabel(dataPrimaryKey)}-${rowIndex}`,
      storageGroup: normalizedStorageGroup,
      dataPrimaryKey,
      dataPrimaryKeyLabel: formatDataPrimaryKeyLabel(dataPrimaryKey),
      propertySummary: buildPageDataRowPropertyCount(item),
    });
  });
  return rows;
}

/** page 响应适配为实例详情弹框所需上下文。 */
export interface MapOntologyEntityRowDetailPageToViewDetailInput {
  ontologyUniqueIdentifier: string;
  entityPrimaryKey: string | number | boolean | Record<string, unknown>;
  storageGroup: string;
}

/**
 * @description 将属性行分页 data 适配为实例详情弹框使用的 VO。
 * @param pageData 分页响应 data。
 * @param input 对象标识、实体主键与存储分组。
 * @returns 详情 VO；pageData 为空时返回 null。
 */
export function mapOntologyEntityRowDetailPageToViewDetail(
  pageData: OntologyEntityRowDetailPageData | null | undefined,
  input: MapOntologyEntityRowDetailPageToViewDetailInput,
): OntologyEntityRowDetailVO | null {
  if (!pageData) return null;
  const storageGroup = normalizeStorageGroupName(input.storageGroup) || "—";
  const records = Array.isArray(pageData.records) ? pageData.records : [];
  const groupDataList = records.map((item) => {
    const props = Array.isArray(item.props) ? item.props : [];
    return {
      dataPrimaryKey: item.dataPrimaryKey,
      props: props.map((prop) => {
        const propertyApiName = (prop.propertyApiName ?? "").trim();
        const propertyDisplayName = (prop.propertyDisplayName ?? "").trim() || propertyApiName;
        return {
          propertyUniqIdentifier: (prop.propertyUniqIdentifier ?? "").trim(),
          propertyApiName,
          propertyDisplayName,
          propertyValue: prop.propertyValue,
          categoryId: prop.categoryId ?? null,
        };
      }),
    };
  });
  return {
    primaryKey: input.entityPrimaryKey,
    ontologyUniqueIdentifier: input.ontologyUniqueIdentifier.trim(),
    propertyGroups: [
      {
        storageGroup,
        groupDataList,
      },
    ],
  };
}
