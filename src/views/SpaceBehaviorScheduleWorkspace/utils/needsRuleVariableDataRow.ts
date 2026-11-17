/**
 * @description 判断变量属性是否需要再选子表数据行。
 * @param storageGroup 属性存储分组。
 * @returns 非空且非 main 时为 true。
 */
export function needsRuleVariableDataRow(storageGroup: string | undefined): boolean {
  const group = typeof storageGroup === "string" ? storageGroup.trim() : "";
  return Boolean(group) && group !== "main";
}
