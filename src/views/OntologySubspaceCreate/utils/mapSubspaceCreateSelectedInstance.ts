import type { SubspaceCreateSelectedObject } from "./mapSubspaceCreateSelectedObject";

export const SUBSPACE_CREATE_INSTANCE_PAGE_SIZE = 10;
/** @deprecated 仅保留兼容旧测试与本地数据迁移，不用于接口实例查询。 */
export const SUBSPACE_CREATE_INSTANCE_SAMPLE_COUNT = 12;

export interface SubspaceCreateSelectedInstance {
  id: string;
  name: string;
  objectId: string;
  objectLabel: string;
}

export interface SubspaceCreateInstanceGroup {
  objectId: string;
  objectLabel: string;
  instances: SubspaceCreateSelectedInstance[];
  total: number;
  page: number;
  pageSize: number;
  status: "idle" | "loading" | "success" | "empty" | "error";
  error: string;
}

/**
 * @description 将实体查询记录映射为子空间实例表格行。
 * @param records 实体查询记录。
 * @param object 关联的对象。
 * @returns 实例表格行。
 */
export function mapSubspaceCreateSelectedInstances(objects: SubspaceCreateSelectedObject[]): SubspaceCreateSelectedInstance[];
export function mapSubspaceCreateSelectedInstances(records: Record<string, unknown>[], object: SubspaceCreateSelectedObject): SubspaceCreateSelectedInstance[];
export function mapSubspaceCreateSelectedInstances(
  recordsOrObjects: Record<string, unknown>[] | SubspaceCreateSelectedObject[],
  object?: SubspaceCreateSelectedObject,
): SubspaceCreateSelectedInstance[] {
  if (!object) {
    return (recordsOrObjects as SubspaceCreateSelectedObject[]).flatMap((item) =>
      Array.from({ length: SUBSPACE_CREATE_INSTANCE_SAMPLE_COUNT }, (_, index) => ({
        id: `${item.id}-${index + 1}`,
        name: `${item.label}实例${index + 1}`,
        objectId: item.id,
        objectLabel: item.label,
      })),
    );
  }
  const records = recordsOrObjects as Record<string, unknown>[];
  return records.map((record, index) => {
    const primaryKey = readEntityValue(record, ["entityPrimaryKey", "id", "primaryKey"]) ?? `${object.id}-${index + 1}`;
    const displayValue = readEntityValue(record, ["name", "displayName", "entityName"]) ?? String(primaryKey);
    return { id: String(primaryKey), name: displayValue, objectId: object.id, objectLabel: object.label };
  });
}

/**
 * @description 从实体记录及其动态属性中读取可展示的字符串值。
 * @param record 实体记录。
 * @param keys 候选字段名。
 * @returns 找到的字符串值。
 */
function readEntityValue(record: Record<string, unknown>, keys: string[]): string | undefined {
  const sources: Record<string, unknown>[] = [record];
  const nestedProperties = record.properties;
  if (isRecord(nestedProperties)) {
    sources.push(nestedProperties);
  }
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) return value;
      if (typeof value === "number") return String(value);
    }
  }
  return undefined;
}

/**
 * @description 判断未知值是否为可读取的对象记录。
 * @param value 待判断值。
 * @returns 是否为对象记录。
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @description 把实例行按所属对象顺序分组，供第二步按对象展示。
 * @param instances 当前可选实例。
 * @returns 按对象划分的实例分组。
 */
export function groupSubspaceCreateInstancesByObject(instances: SubspaceCreateSelectedInstance[]): SubspaceCreateInstanceGroup[] {
  const groups: SubspaceCreateInstanceGroup[] = [];
  const groupsByObjectId = new Map<string, SubspaceCreateInstanceGroup>();
  for (const instance of instances) {
    const existingGroup = groupsByObjectId.get(instance.objectId);
    if (existingGroup) {
      existingGroup.instances.push(instance);
      continue;
    }
    const created: SubspaceCreateInstanceGroup = {
      objectId: instance.objectId,
      objectLabel: instance.objectLabel,
      instances: [instance],
      total: instances.length,
      page: 1,
      pageSize: SUBSPACE_CREATE_INSTANCE_PAGE_SIZE,
      status: "success",
      error: "",
    };
    groupsByObjectId.set(instance.objectId, created);
    groups.push(created);
  }
  return groups;
}

/**
 * @description 把页码收敛到当前总数和每页条数允许的范围内。
 * @param total 当前分组实例总数。
 * @param page 目标页码。
 * @param pageSize 每页条数。
 * @returns 合法页码，至少为 1。
 */
export function resolveSubspaceCreateInstancePage(total: number, page: number, pageSize: number): number {
  const safePageSize = pageSize > 0 ? pageSize : SUBSPACE_CREATE_INSTANCE_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / safePageSize));
  return Math.min(Math.max(page, 1), totalPages);
}

/**
 * @description 按页码和每页条数切出当前页实例，非法页码会先收敛。
 * @param instances 某个对象下的全部实例。
 * @param page 目标页码。
 * @param pageSize 每页条数。
 * @returns 当前页实例。
 */
export function sliceSubspaceCreateInstancePage(instances: SubspaceCreateSelectedInstance[], page: number, pageSize: number): SubspaceCreateSelectedInstance[] {
  const safePageSize = pageSize > 0 ? pageSize : SUBSPACE_CREATE_INSTANCE_PAGE_SIZE;
  const safePage = resolveSubspaceCreateInstancePage(instances.length, page, safePageSize);
  const start = (safePage - 1) * safePageSize;
  return instances.slice(start, start + safePageSize);
}

/**
 * @description 切换单条实例勾选，并保留其他对象或其他页已选 id。
 * @param selectedIds 当前已选实例 id。
 * @param instanceId 目标实例 id。
 * @param checked 是否勾选。
 * @returns 合并后的已选 id。
 */
export function toggleSubspaceCreateInstanceSelection(selectedIds: string[], instanceId: string, checked: boolean): string[] {
  if (checked) {
    if (selectedIds.includes(instanceId)) {
      return selectedIds;
    }
    return [...selectedIds, instanceId];
  }
  return selectedIds.filter((id) => id !== instanceId);
}

/**
 * @description 勾选或取消某个对象下的全部实例，不改动其他对象的已选 id。
 * @param selectedIds 当前已选实例 id。
 * @param instances 目标对象下的全部实例。
 * @param checked 是否全选该对象。
 * @returns 合并后的已选 id。
 */
export function selectAllSubspaceCreateInstances(selectedIds: string[], instances: SubspaceCreateSelectedInstance[], checked: boolean): string[] {
  const groupIds = new Set(instances.map((item) => item.id));
  if (!checked) {
    return selectedIds.filter((id) => !groupIds.has(id));
  }
  const merged = [...selectedIds];
  for (const instance of instances) {
    if (!merged.includes(instance.id)) {
      merged.push(instance.id);
    }
  }
  return merged;
}
