import type { OntologyEntityInfo } from "@/types";

/** 实体列表表格行。 */
export interface ObjectProfileEntityRow {
  /** 行唯一键。 */
  rowKey: string;
  /** 动态属性展示值。 */
  cells: Record<string, string>;
  /** 详情弹窗用的有序属性对。 */
  detailItems: Array<{ label: string; value: string }>;
}

const RESERVED_KEYS = new Set(["id", "entityPrimaryKey", "ontologyUniqueIdentifier", "properties"]);

const COLUMN_CONFIG_STORAGE_PREFIX = "entity-browsing-object-profile-entity-list-columns:";

/**
 * @description 判断未知值是否为可遍历的普通对象。
 * @param value 待判断值。
 * @returns 是否为对象记录。
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @description 将未知属性值格式化为表格单元格文案。
 * @param value 属性值。
 * @returns 展示字符串。
 */
function formatEntityCellValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") return JSON.stringify(value) ?? "";
  return String(value);
}

/**
 * @description 将 OpenAPI 属性数组项解析为列名与值；无效项返回 null。
 * @param item 属性数组项。
 * @returns 列名与原始值，或 null。
 */
function resolveEntityPropertyItem(item: unknown): { label: string; value: unknown } | null {
  if (!isRecord(item)) return null;
  const typed = item;
  const displayName = typeof typed.propertyDisplayName === "string" ? typed.propertyDisplayName.trim() : "";
  const name = typeof typed.propertyName === "string" ? typed.propertyName.trim() : "";
  const apiName = typeof typed.propertyApiName === "string" ? typed.propertyApiName.trim() : "";
  const label = displayName || name || apiName;
  if (!label) return null;
  return { label, value: typed.propertyValue };
}

/**
 * @description 收集单条实体记录的展示属性（优先 properties，再合并顶层动态键）。
 * @param record 实体记录。
 * @returns 属性名到值的映射。
 */
function collectEntityPropertyMap(record: OntologyEntityInfo): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  const properties = record.properties;

  if (Array.isArray(properties)) {
    for (const item of properties) {
      const resolved = resolveEntityPropertyItem(item);
      if (!resolved) continue;
      if (resolved.label in merged) continue;
      merged[resolved.label] = resolved.value;
    }
  } else if (isRecord(properties)) {
    Object.assign(merged, properties);
  }

  for (const [key, value] of Object.entries(record)) {
    if (RESERVED_KEYS.has(key)) continue;
    if (key in merged) continue;
    merged[key] = value;
  }
  return merged;
}

/**
 * @description 从实体记录集合推导动态列名（按首次出现顺序并集）。
 * @param records 实体记录列表。
 * @returns 列名数组。
 */
export function collectObjectProfileEntityColumns(records: readonly OntologyEntityInfo[]): string[] {
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const record of records) {
    for (const key of Object.keys(collectEntityPropertyMap(record))) {
      if (seen.has(key)) continue;
      seen.add(key);
      columns.push(key);
    }
  }
  return columns;
}

/**
 * @description 将实体记录映射为表格行。
 * @param records 实体记录列表。
 * @returns 表格行列表。
 */
export function mapObjectProfileEntityRows(records: readonly OntologyEntityInfo[]): ObjectProfileEntityRow[] {
  return records.map((record, index) => {
    const propertyMap = collectEntityPropertyMap(record);
    const cells: Record<string, string> = {};
    const detailItems: Array<{ label: string; value: string }> = [];
    for (const [label, raw] of Object.entries(propertyMap)) {
      const value = formatEntityCellValue(raw);
      cells[label] = value;
      detailItems.push({ label, value });
    }
    const rowKey = String(record.entityPrimaryKey ?? record.id ?? `row-${index + 1}`);
    return { rowKey, cells, detailItems };
  });
}

/**
 * @description 按筛选字段与筛选值对当前页行做包含匹配；字段或值为空时返回全部行。
 * @param rows 当前页行。
 * @param field 筛选字段名。
 * @param keyword 筛选值。
 * @returns 过滤后的行。
 */
export function filterObjectProfileEntityRows(rows: readonly ObjectProfileEntityRow[], field: string, keyword: string): ObjectProfileEntityRow[] {
  const column = field.trim();
  const value = keyword.trim().toLowerCase();
  if (!column || !value) return [...rows];
  return rows.filter((row) => (row.cells[column] ?? "").toLowerCase().includes(value));
}

/**
 * @description 生成本地列配置存储键。
 * @param objectId 对象唯一标识。
 * @returns localStorage key。
 */
export function buildObjectProfileEntityColumnStorageKey(objectId: string): string {
  return `${COLUMN_CONFIG_STORAGE_PREFIX}${objectId.trim()}`;
}

/**
 * @description 按全部列与历史勾选求可见列：仅保留仍存在的勾选，保持 allColumns 顺序；无历史或交集为空时默认全选。
 * @param allColumns 当前可用列。
 * @param storedColumns 历史勾选列（可为 null）。
 * @returns 可见列。
 */
export function resolveObjectProfileEntityVisibleColumns(allColumns: readonly string[], storedColumns: readonly string[] | null): string[] {
  if (!allColumns.length) return [];
  if (!storedColumns) return [...allColumns];

  const selected = new Set(storedColumns);
  const visible = allColumns.filter((column) => selected.has(column));
  return visible.length ? visible : [...allColumns];
}

/**
 * @description 在已有勾选上追加新出现的列（保持 allColumns 顺序）。
 * @param allColumns 当前可用列。
 * @param previousColumns 上一轮可用列。
 * @param selectedColumns 当前勾选列。
 * @returns 合并后的勾选列。
 */
export function appendNewObjectProfileEntityColumns(
  allColumns: readonly string[],
  previousColumns: readonly string[],
  selectedColumns: readonly string[],
): string[] {
  const previous = new Set(previousColumns);
  const selected = new Set(selectedColumns);
  for (const column of allColumns) {
    if (!previous.has(column)) selected.add(column);
  }
  return allColumns.filter((column) => selected.has(column));
}

/**
 * @description 从 localStorage 读取列勾选配置；失败或非法时返回 null。
 * @param objectId 对象唯一标识。
 * @returns 历史列名数组或 null。
 */
export function readObjectProfileEntityVisibleColumns(objectId: string): string[] | null {
  const id = objectId.trim();
  if (!id || typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(buildObjectProfileEntityColumnStorageKey(id));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const columns = parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    return columns.length ? columns : null;
  } catch {
    return null;
  }
}

/**
 * @description 将可见列写入 localStorage。
 * @param objectId 对象唯一标识。
 * @param columns 可见列。
 */
export function writeObjectProfileEntityVisibleColumns(objectId: string, columns: readonly string[]): void {
  const id = objectId.trim();
  if (!id || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(buildObjectProfileEntityColumnStorageKey(id), JSON.stringify([...columns]));
  } catch {
    // 存储配额或隐私模式失败时忽略，不影响当前会话展示。
  }
}
