import type { OntologyPropertyInfo } from "@/types";

/**
 * @description 规范化存储分组，用于分组排序比较。
 * @param value 原始存储分组。
 * @returns 去首尾空白后的分组名。
 */
function normalizeStorageGroupForSort(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @description 按存储分组聚合排序属性行：分组名 localeCompare，组内保持原相对顺序。
 * @param rows 待排序属性列表。
 * @returns 同组连续排列后的新数组。
 */
export function sortPropertyInfosByStorageGroup(rows: readonly OntologyPropertyInfo[]): OntologyPropertyInfo[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const groupCompare = normalizeStorageGroupForSort(left.row.storageGroup).localeCompare(normalizeStorageGroupForSort(right.row.storageGroup), "zh-CN");
      if (groupCompare !== 0) return groupCompare;
      return left.index - right.index;
    })
    .map((item) => item.row);
}
