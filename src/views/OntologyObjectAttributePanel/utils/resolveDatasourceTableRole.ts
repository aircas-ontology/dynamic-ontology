/** 左侧数据源表在关联画布上的角色徽章文案。 */
export type DatasourceTableRole = "主表" | "子表" | "表";

/** 反推主子表时使用的对象属性片段。 */
export interface DatasourceTableRoleProperty {
  storageGroup: string;
  boundTableId?: string | null;
}

/**
 * @description 判断存储分组是否表示主表（main 或空）。
 * @param storageGroup 属性存储分组。
 * @returns 是否主表存储分组。
 */
export function isMainStorageGroup(storageGroup: string | undefined): boolean {
  const group = typeof storageGroup === "string" ? storageGroup.trim() : "";
  return group === "" || group === "main";
}

/**
 * @description 根据对象属性 storageGroup 反推数据源表是主表还是子表。
 * @param table 左侧画布中的表标识与名称。
 * @param properties 对象属性及其可选绑定表标识。
 * @returns 主表、子表；无法判定时返回「表」。
 */
export function resolveDatasourceTableRole(table: { id: string; name: string }, properties: readonly DatasourceTableRoleProperty[]): DatasourceTableRole {
  const bound = properties.filter((property) => property.boundTableId === table.id);
  if (bound.length > 0) {
    return bound.some((property) => isMainStorageGroup(property.storageGroup)) ? "主表" : "子表";
  }

  const tableName = table.name.trim().toLowerCase();
  const hasMatchingSubGroup = properties.some((property) => {
    if (isMainStorageGroup(property.storageGroup)) return false;
    return property.storageGroup.trim().toLowerCase() === tableName;
  });
  if (hasMatchingSubGroup) return "子表";

  if (properties.some((property) => isMainStorageGroup(property.storageGroup))) return "主表";
  return "表";
}
