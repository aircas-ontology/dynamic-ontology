import type { SpaceBehaviorActionInfoViewParamRow } from "./mapOntologyActionInfoToViewState";
import { isMainStorageGroup, normalizeStorageGroup } from "./resolveAttributeValueSelection.ts";

/** 应用行为测试中 PROPERTY / WRITE_PROPERTY 对应的对象实例选择器种子。 */
export interface ApplicationPropertyOntologyPickerSeed {
  ontologyUniqueIdentifier: string;
  /** 展示标签：优先首个属性 displayName，否则参数名或对象标识。 */
  label: string;
}

/** 应用行为测试非 main 存储分组的数据行选择器种子。 */
export interface ApplicationStorageGroupPickerSeed {
  /** ontologyUniqueIdentifier::storageGroup */
  pickerKey: string;
  ontologyUniqueIdentifier: string;
  storageGroup: string;
  /** 展示标签。 */
  label: string;
}

/**
 * @description 向选择器列表追加对象种子（按 ontologyUniqueIdentifier 去重）。
 * @param seen 已收录对象标识集合。
 * @param result 选择器种子列表。
 * @param row 参数行。
 */
function pushOntologyPickerSeed(seen: Set<string>, result: ApplicationPropertyOntologyPickerSeed[], row: SpaceBehaviorActionInfoViewParamRow): void {
  const ontologyUniqueIdentifier = (row.ontologyUniqueIdentifier ?? "").trim();
  if (!ontologyUniqueIdentifier || seen.has(ontologyUniqueIdentifier)) return;
  seen.add(ontologyUniqueIdentifier);
  const label = (row.propertyDisplayName ?? "").trim() || (row.paramName ?? "").trim() || ontologyUniqueIdentifier;
  result.push({ ontologyUniqueIdentifier, label });
}

/**
 * @description 组装非 main 存储分组选择器键。
 * @param ontologyUniqueIdentifier 对象标识。
 * @param storageGroup 存储分组。
 * @returns 选择器键。
 */
export function buildApplicationStorageGroupPickerKey(ontologyUniqueIdentifier: string, storageGroup: string): string {
  return `${ontologyUniqueIdentifier.trim()}::${normalizeStorageGroup(storageGroup)}`;
}

/**
 * @description 向非 main 分组选择器追加种子（按 ontology + storageGroup 去重）。
 * @param seen 已收录键集合。
 * @param result 种子列表。
 * @param row 参数行。
 */
function pushStorageGroupPickerSeed(seen: Set<string>, result: ApplicationStorageGroupPickerSeed[], row: SpaceBehaviorActionInfoViewParamRow): void {
  const ontologyUniqueIdentifier = (row.ontologyUniqueIdentifier ?? "").trim();
  const storageGroup = normalizeStorageGroup(row.storageGroup);
  if (!ontologyUniqueIdentifier || !storageGroup || isMainStorageGroup(storageGroup)) return;
  const pickerKey = buildApplicationStorageGroupPickerKey(ontologyUniqueIdentifier, storageGroup);
  if (seen.has(pickerKey)) return;
  seen.add(pickerKey);
  const label = `${(row.propertyDisplayName ?? "").trim() || (row.paramName ?? "").trim() || ontologyUniqueIdentifier} · ${storageGroup}`.trim();
  result.push({ pickerKey, ontologyUniqueIdentifier, storageGroup, label });
}

/**
 * @description 从 INPUT PROPERTY 与 OUTPUT WRITE_PROPERTY 行按对象标识去重，收集实例选择器。
 * @param inputRows 行为详情 INPUT 行。
 * @param writePropertyOutputRows WRITE_PROPERTY 出参行；缺省为空。
 * @returns 选择器种子列表（保持首次出现顺序）。
 */
export function collectApplicationPropertyOntologyPickers(
  inputRows: SpaceBehaviorActionInfoViewParamRow[],
  writePropertyOutputRows: SpaceBehaviorActionInfoViewParamRow[] = [],
): ApplicationPropertyOntologyPickerSeed[] {
  const seen = new Set<string>();
  const result: ApplicationPropertyOntologyPickerSeed[] = [];
  for (const row of inputRows) {
    if ((row.sourceType ?? "").trim().toUpperCase() !== "PROPERTY") continue;
    pushOntologyPickerSeed(seen, result, row);
  }
  for (const row of writePropertyOutputRows) {
    if ((row.outputMode ?? "").trim().toUpperCase() !== "WRITE_PROPERTY") continue;
    pushOntologyPickerSeed(seen, result, row);
  }
  return result;
}

/**
 * @description 从 INPUT PROPERTY 与 OUTPUT WRITE_PROPERTY 收集非 main 存储分组数据行选择器。
 * @param inputRows 行为详情 INPUT 行。
 * @param writePropertyOutputRows WRITE_PROPERTY 出参行；缺省为空。
 * @returns 分组选择器种子列表。
 */
export function collectApplicationStorageGroupPickers(
  inputRows: SpaceBehaviorActionInfoViewParamRow[],
  writePropertyOutputRows: SpaceBehaviorActionInfoViewParamRow[] = [],
): ApplicationStorageGroupPickerSeed[] {
  const seen = new Set<string>();
  const result: ApplicationStorageGroupPickerSeed[] = [];
  for (const row of inputRows) {
    if ((row.sourceType ?? "").trim().toUpperCase() !== "PROPERTY") continue;
    pushStorageGroupPickerSeed(seen, result, row);
  }
  for (const row of writePropertyOutputRows) {
    if ((row.outputMode ?? "").trim().toUpperCase() !== "WRITE_PROPERTY") continue;
    pushStorageGroupPickerSeed(seen, result, row);
  }
  return result;
}

/**
 * @description 规范化入参来源类型展示文案。
 * @param sourceType 原始 sourceType。
 * @returns 展示文案。
 */
export function formatApplicationInputSourceTypeLabel(sourceType: string): string {
  const normalized = sourceType.trim().toUpperCase();
  if (normalized === "EXTERNAL") return "外部输入";
  if (normalized === "FIXED") return "固定值";
  if (normalized === "PROPERTY") return "对象属性";
  if (normalized === "OBJECT") return "对象";
  if (normalized === "LIST") return "列表";
  return sourceType.trim() || "—";
}

/**
 * @description 规范化出参 outputMode 展示文案。
 * @param outputMode 原始 outputMode。
 * @returns 展示文案。
 */
export function formatApplicationOutputModeLabel(outputMode: string): string {
  const normalized = outputMode.trim().toUpperCase();
  if (normalized === "WRITE_PROPERTY") return "写入对象属性";
  if (normalized === "RESULT_ONLY") return "仅返回结果";
  return outputMode.trim() || "—";
}
