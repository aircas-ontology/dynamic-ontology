import type { CreateOntologySubspaceParams, CreateOntologySubspacePropertyFilter } from "@/types";
import type { SubspaceCreateObjectPropertyGroup } from "./mapSubspaceCreateObjectProperty";
import type { SubspaceCreateInstanceGroup } from "./mapSubspaceCreateSelectedInstance";
import type { SubspaceCreateSelectedObject } from "./mapSubspaceCreateSelectedObject";
import type { SubspaceCreateSelectedRelation } from "./mapSubspaceCreateSelectedRelation";

export interface SubspaceCreatePropertyFilterState {
  text: string;
  number: number | null;
  numberRange: [number | null, number | null];
  dateRange: [string, string] | undefined;
  booleanValue: boolean | undefined;
}

export interface SubspaceCreateRequestMappingInput {
  parentSpaceId: string;
  displayName: string;
  apiName: string;
  selectedObjects: SubspaceCreateSelectedObject[];
  instanceGroups: SubspaceCreateInstanceGroup[];
  selectedInstanceIds: string[];
  selectedPropertyIds: string[];
  propertyGroups: SubspaceCreateObjectPropertyGroup[];
  propertyFilters: Record<string, SubspaceCreatePropertyFilterState>;
  selectedRelationIds: string[];
  relationRows: SubspaceCreateSelectedRelation[];
}

/**
 * @description 将子空间创建页面状态转换为创建接口请求体。
 * @param input 页面当前选中状态。
 * @returns 创建子空间请求体。
 */
export function mapSubspaceCreateRequest(input: SubspaceCreateRequestMappingInput): CreateOntologySubspaceParams {
  const parentSpaceId = Number(input.parentSpaceId);
  return {
    parentSpaceId,
    displayName: input.displayName.trim(),
    apiName: input.apiName.trim(),
    description: input.displayName.trim(),
    selectedOntologies: input.selectedObjects.map((object) => ({
      sourceOntologyUniqueIdentifier: object.id,
      selectedInstancePrimaryKeys:
        input.instanceGroups
          .find((group) => group.objectId === object.id)
          ?.instances.filter((instance) => input.selectedInstanceIds.includes(instance.id))
          .map((instance) => readPrimaryKey(instance.id)) ?? [],
      selectedProperties:
        input.propertyGroups
          .find((group) => group.objectId === object.id)
          ?.properties.filter((property) => input.selectedPropertyIds.includes(property.id))
          .map((property) => ({
            sourcePropertyUniqueIdentifier: property.id,
            filter: mapPropertyFilter(input.propertyFilters[property.id], property.dataType),
          })) ?? [],
    })),
    selectedLinks: input.relationRows
      .filter((row) => input.selectedRelationIds.includes(row.id))
      .map((row) => ({
        sourceLinkUniqueIdentifier: row.id,
        name: row.displayName,
        apiName: row.apiName ?? "",
        type: row.type ?? "",
        description: row.description ?? "",
      })),
  };
}

/** @description 将页面实例主键转换为接口支持的数字或字符串。 */
function readPrimaryKey(value: string): string | number {
  return /^-?\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : value;
}

/** @description 将页面筛选状态转换为接口筛选条件。 */
function mapPropertyFilter(state: SubspaceCreatePropertyFilterState | undefined, dataType: string): CreateOntologySubspacePropertyFilter | null {
  if (state?.dateRange) return { op: "BETWEEN", value: state.dateRange, dataType };
  const numberRangeFilter = mapNumberRangeFilter(state?.numberRange, dataType);
  if (numberRangeFilter) return numberRangeFilter;
  if (typeof state?.number === "number") return { op: "EQ", value: state.number, dataType };
  if (typeof state?.booleanValue === "boolean") return { op: "EQ", value: state.booleanValue, dataType };
  if (state?.text.trim()) return { op: "LIKE", value: state.text.trim(), dataType };
  return null;
}

/**
 * @description 将数字区间映射为接口可接收的筛选条件：两端都填用 BETWEEN，只填一端用 GE 或 LE。
 * @param range 最小值和最大值，允许一端为空。
 * @param dataType 属性数据类型。
 * @returns 接口筛选条件；两端都空时返回空。
 */
function mapNumberRangeFilter(range: [number | null, number | null] | undefined, dataType: string): CreateOntologySubspacePropertyFilter | null {
  const min = range?.[0];
  const max = range?.[1];
  const hasMin = typeof min === "number";
  const hasMax = typeof max === "number";
  if (hasMin && hasMax) {
    return { op: "BETWEEN", value: [Math.min(min, max), Math.max(min, max)], dataType };
  }
  if (hasMin) return { op: "GE", value: min, dataType };
  if (hasMax) return { op: "LE", value: max, dataType };
  return null;
}
