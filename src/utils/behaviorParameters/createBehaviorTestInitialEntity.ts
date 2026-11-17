import type { BehaviorTestEntityRow, GetOntologyEntityRowDetailParams } from "@/types";

/** @description 将当前实例转换为测试选项，保留原始主键类型及跨页快照。 @param objectId 对象唯一标识。 @param entityPrimaryKey 实例原始主键。 @param entityName 实例名称。 @returns 测试实例选项。 */
export function createBehaviorTestInitialEntity(
  objectId: string,
  entityPrimaryKey: GetOntologyEntityRowDetailParams["entityPrimaryKey"],
  entityName: string,
): BehaviorTestEntityRow {
  const primaryKey = typeof entityPrimaryKey === "string" || typeof entityPrimaryKey === "number" ? entityPrimaryKey : JSON.stringify(entityPrimaryKey);
  return {
    rowKey: JSON.stringify([objectId, entityPrimaryKey]),
    displayName: entityName,
    primaryKey,
    primaryKeyLabel: String(primaryKey),
    ontologyName: objectId,
    propertySummary: "",
    savedPrimaryKey: entityPrimaryKey,
    raw: { ontologyUniqueIdentifier: objectId, primaryKey: entityPrimaryKey, displayName: entityName },
  };
}

/** @description 将已选实例加入当前页选项，避免首屏外实例丢失及同一实例重复展示。 @param rows 当前页选项。 @param selected 已选实例快照。 @returns 包含当前实例的选项列表。 */
export function mergeBehaviorTestEntityRows(rows: BehaviorTestEntityRow[], selected: BehaviorTestEntityRow): BehaviorTestEntityRow[] {
  const key = JSON.stringify(selected.savedPrimaryKey ?? selected.primaryKey);
  return [selected, ...rows.filter((row) => row.rowKey !== selected.rowKey && JSON.stringify(row.savedPrimaryKey ?? row.primaryKey) !== key)];
}
