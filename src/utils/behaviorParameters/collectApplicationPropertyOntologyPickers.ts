import type { SpaceBehaviorActionInfoViewParamRow } from "@/types";
import { isMainStorageGroup, normalizeStorageGroup } from "./resolveAttributeValueSelection.ts";

/** 应用行为实例选择器侧别：入参 PROPERTY / 写回 WRITE_PROPERTY。 */
export type ApplicationOntologyPickerSide = "input" | "output";

/** 应用行为测试中 PROPERTY / WRITE_PROPERTY 对应的对象实例选择器种子（按侧别 + 参数独立）。 */
export interface ApplicationPropertyOntologyPickerSeed {
  /** 选择器键：`input::paramName` 或 `output::paramName`。 */
  pickerKey: string;
  /** 侧别。 */
  side: ApplicationOntologyPickerSide;
  paramName: string;
  ontologyUniqueIdentifier: string;
  /** 展示标签：优先属性 displayName，否则参数名或对象标识。 */
  label: string;
}

/** 应用行为测试非 main 存储分组的数据行选择器种子（按参数独立）。 */
export interface ApplicationStorageGroupPickerSeed {
  /** paramName::storageGroup */
  pickerKey: string;
  paramName: string;
  ontologyUniqueIdentifier: string;
  storageGroup: string;
  /** 展示标签。 */
  label: string;
}

/**
 * @description 组装应用行为对象实例选择器键（区分入参 / 写回出参）。
 * @param side 侧别。
 * @param paramName 参数名。
 * @returns 选择器键。
 */
export function buildApplicationOntologyPickerKey(side: ApplicationOntologyPickerSide, paramName: string): string {
  return `${side}::${paramName.trim()}`;
}

/**
 * @description 向选择器列表追加参数级对象种子（按侧别 + 参数名去重）。
 * @param seen 已收录选择器键集合。
 * @param result 选择器种子列表。
 * @param side 侧别。
 * @param row 参数行。
 */
function pushOntologyPickerSeed(
  seen: Set<string>,
  result: ApplicationPropertyOntologyPickerSeed[],
  side: ApplicationOntologyPickerSide,
  row: SpaceBehaviorActionInfoViewParamRow,
): void {
  const paramName = (row.paramName ?? "").trim();
  const ontologyUniqueIdentifier = (row.ontologyUniqueIdentifier ?? "").trim();
  if (!paramName || !ontologyUniqueIdentifier) return;
  const pickerKey = buildApplicationOntologyPickerKey(side, paramName);
  if (seen.has(pickerKey)) return;
  seen.add(pickerKey);
  const label = (row.propertyDisplayName ?? "").trim() || paramName || ontologyUniqueIdentifier;
  result.push({ pickerKey, side, paramName, ontologyUniqueIdentifier, label });
}

/**
 * @description 组装非 main 存储分组选择器键（按参数名）。
 * @param paramName 参数名。
 * @param storageGroup 存储分组。
 * @returns 选择器键。
 */
export function buildApplicationStorageGroupPickerKey(paramName: string, storageGroup: string): string {
  return `${paramName.trim()}::${normalizeStorageGroup(storageGroup)}`;
}

/**
 * @description 向非 main 分组选择器追加种子（按参数名 + storageGroup 去重）。
 * @param seen 已收录键集合。
 * @param result 种子列表。
 * @param row 参数行。
 */
function pushStorageGroupPickerSeed(seen: Set<string>, result: ApplicationStorageGroupPickerSeed[], row: SpaceBehaviorActionInfoViewParamRow): void {
  const paramName = (row.paramName ?? "").trim();
  const ontologyUniqueIdentifier = (row.ontologyUniqueIdentifier ?? "").trim();
  const storageGroup = normalizeStorageGroup(row.storageGroup);
  if (!paramName || !ontologyUniqueIdentifier || !storageGroup || isMainStorageGroup(storageGroup)) return;
  const pickerKey = buildApplicationStorageGroupPickerKey(paramName, storageGroup);
  if (seen.has(pickerKey)) return;
  seen.add(pickerKey);
  const label = `${(row.propertyDisplayName ?? "").trim() || paramName || ontologyUniqueIdentifier} · ${storageGroup}`.trim();
  result.push({ pickerKey, paramName, ontologyUniqueIdentifier, storageGroup, label });
}

/**
 * @description 从 INPUT PROPERTY 与 OUTPUT WRITE_PROPERTY 行按侧别 + 参数名收集实例选择器。
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
    pushOntologyPickerSeed(seen, result, "input", row);
  }
  for (const row of writePropertyOutputRows) {
    if ((row.outputMode ?? "").trim().toUpperCase() !== "WRITE_PROPERTY") continue;
    pushOntologyPickerSeed(seen, result, "output", row);
  }
  return result;
}

/**
 * @description 从 INPUT PROPERTY 按参数收集非 main 存储分组数据行选择器（写回出参仅选实例，不收集）。
 * @param inputRows 行为详情 INPUT 行。
 * @param _writePropertyOutputRows 保留参数位以兼容既有调用；写回出参不再生成数据行选择器。
 * @returns 分组选择器种子列表。
 */
export function collectApplicationStorageGroupPickers(
  inputRows: SpaceBehaviorActionInfoViewParamRow[],
  _writePropertyOutputRows: SpaceBehaviorActionInfoViewParamRow[] = [],
): ApplicationStorageGroupPickerSeed[] {
  const seen = new Set<string>();
  const result: ApplicationStorageGroupPickerSeed[] = [];
  for (const row of inputRows) {
    if ((row.sourceType ?? "").trim().toUpperCase() !== "PROPERTY") continue;
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
