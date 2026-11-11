import type { OntologyPropertyInfo, SpaceBehaviorBasicAction } from "@/types";

export interface AttributeValueSelectionResult {
  selectedRows: OntologyPropertyInfo[];
  storageGroup: string;
  warning: string;
}

/**
 * @description 规范化存储分组，用于同组比较。
 * @param value 原始存储分组。
 * @returns 去首尾空白后的分组名。
 */
export function normalizeStorageGroup(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @description 判断是否为 main 存储分组。
 * @param value 原始存储分组。
 * @returns main 时为 true。
 */
export function isMainStorageGroup(value: string | undefined): boolean {
  return normalizeStorageGroup(value) === "main";
}

/**
 * @description 读取属性行唯一标识。
 * @param row 属性信息。
 * @returns 去空白后的 uniqueIdentifier。
 */
export function readPropertyRowId(row: OntologyPropertyInfo): string {
  return typeof row.uniqueIdentifier === "string" ? row.uniqueIdentifier.trim() : "";
}

/**
 * @description 判断属性值行为下某属性行是否允许勾选。
 * @param basicAction 基础操作。
 * @param row 属性行。
 * @param readonlyMode 是否只读。
 * @returns 可勾选时为 true。
 */
export function isAttributeValueRowSelectable(basicAction: SpaceBehaviorBasicAction, row: OntologyPropertyInfo, readonlyMode: boolean): boolean {
  if (readonlyMode) return false;
  if ((basicAction === "create" || basicAction === "delete") && isMainStorageGroup(row.storageGroup)) return false;
  return Boolean(readPropertyRowId(row));
}

/**
 * @description 列出同一存储分组下的全部有效属性行。
 * @param rows 全部属性行。
 * @param storageGroup 目标存储分组。
 * @returns 同组属性列表。
 */
export function listPropertyRowsByStorageGroup(rows: OntologyPropertyInfo[], storageGroup: string): OntologyPropertyInfo[] {
  const group = normalizeStorageGroup(storageGroup);
  return rows.filter((row) => readPropertyRowId(row) && normalizeStorageGroup(row.storageGroup) === group);
}

/**
 * @description 按基础操作规则决议属性勾选结果：同组限制；新增/删除禁 main 且同组全选；修改可同组多选。
 * @param input.basicAction 基础操作。
 * @param input.previousIds 变更前已选属性 id。
 * @param input.selection 表格当前勾选行。
 * @param input.allRows 当前对象全部属性行。
 * @returns 决议后的勾选行、存储分组与可选警告文案。
 */
export function resolveAttributeValueSelection(input: {
  basicAction: SpaceBehaviorBasicAction;
  previousIds: readonly string[];
  selection: readonly OntologyPropertyInfo[];
  allRows: readonly OntologyPropertyInfo[];
}): AttributeValueSelectionResult {
  const { basicAction, previousIds, selection, allRows } = input;
  let warning = "";
  let next = selection.filter((row) => readPropertyRowId(row));

  if (basicAction === "create" || basicAction === "delete") {
    const withoutMain = next.filter((row) => !isMainStorageGroup(row.storageGroup));
    if (withoutMain.length !== next.length) {
      warning = basicAction === "create" ? "新增不可选择 main 分组属性" : "删除不可选择 main 分组属性";
      next = withoutMain;
    }
  }

  const groups = new Set(next.map((row) => normalizeStorageGroup(row.storageGroup)));
  if (groups.size > 1) {
    const previousIdSet = new Set(previousIds);
    const newlySelected = next.filter((row) => !previousIdSet.has(readPropertyRowId(row)));
    const targetGroup = normalizeStorageGroup((newlySelected.at(-1) ?? next.at(-1))?.storageGroup);
    next = next.filter((row) => normalizeStorageGroup(row.storageGroup) === targetGroup);
    if (!warning) warning = "仅可多选同一存储分组下的属性";
  }

  const storageGroup = next[0] ? normalizeStorageGroup(next[0].storageGroup) : "";
  if (!storageGroup) {
    return { selectedRows: [], storageGroup: "", warning };
  }

  if ((basicAction === "create" || basicAction === "delete") && !isMainStorageGroup(storageGroup)) {
    const allInGroup = listPropertyRowsByStorageGroup([...allRows], storageGroup);
    const previousIdSet = new Set(previousIds);
    const nextIdSet = new Set(next.map((row) => readPropertyRowId(row)));
    const previousInGroupIds = allInGroup.map((row) => readPropertyRowId(row)).filter((id) => previousIdSet.has(id));
    const removed = previousInGroupIds.some((id) => !nextIdSet.has(id));
    const added = [...nextIdSet].some((id) => !previousIdSet.has(id));
    if (removed && !added) {
      return { selectedRows: [], storageGroup: "", warning };
    }
    return { selectedRows: allInGroup, storageGroup, warning };
  }

  return {
    selectedRows: next.filter((row) => normalizeStorageGroup(row.storageGroup) === storageGroup),
    storageGroup,
    warning,
  };
}
