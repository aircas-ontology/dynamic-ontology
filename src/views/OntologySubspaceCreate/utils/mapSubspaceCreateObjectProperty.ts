import type { SubspaceCreateSelectedObject } from "./mapSubspaceCreateSelectedObject";

export interface SubspaceCreateObjectProperty {
  id: string;
  objectId: string;
  objectLabel: string;
  displayName: string;
  apiName: string;
  dataType: string;
}

export interface SubspaceCreateObjectPropertyGroup {
  objectId: string;
  objectLabel: string;
  properties: SubspaceCreateObjectProperty[];
}

interface SubspaceCreatePropertyRecord {
  displayName?: string;
  apiName?: string;
  propertyType?: string;
  uniqueIdentifier?: string;
}

const subspaceCreatePropertyCatalog = [
  { displayName: "舷号", apiName: "hullNumber", dataType: "String" },
  { displayName: "舰名", apiName: "shipName", dataType: "String" },
  { displayName: "北约代号", apiName: "natoCode", dataType: "String" },
  { displayName: "服役时间", apiName: "commissionDate", dataType: "Date" },
  { displayName: "全长", apiName: "lengthOverall", dataType: "Double" },
  { displayName: "型宽", apiName: "beam", dataType: "Double" },
  { displayName: "吃水", apiName: "draft", dataType: "Double" },
  { displayName: "飞行甲板面积", apiName: "flightDeckArea", dataType: "Double" },
  { displayName: "标准排水量", apiName: "standardDisplacement", dataType: "Double" },
] as const;

/**
 * @description 按选中对象生成属性分组，供第三步按对象展示和分组全选。
 * @param objects 第一步勾选的对象。
 * @returns 按对象分组的属性列表。
 */
export function mapSubspaceCreateObjectPropertyGroups(objects: SubspaceCreateSelectedObject[]): SubspaceCreateObjectPropertyGroup[] {
  return objects.map((object) => ({
    objectId: object.id,
    objectLabel: object.label,
    properties: subspaceCreatePropertyCatalog.map((item) => ({
      id: `${object.id}-${item.apiName}`,
      objectId: object.id,
      objectLabel: object.label,
      displayName: item.displayName,
      apiName: item.apiName,
      dataType: item.dataType,
    })),
  }));
}

/**
 * @description 将对象属性接口记录映射为子空间属性分组。
 * @param records 对象属性接口记录。
 * @param object 关联的对象。
 * @returns 页面属性分组。
 */
export function mapSubspaceCreateObjectPropertyGroup(
  records: SubspaceCreatePropertyRecord[],
  object: SubspaceCreateSelectedObject,
): SubspaceCreateObjectPropertyGroup {
  return {
    objectId: object.id,
    objectLabel: object.label,
    properties: records.map((record, index) => {
      const apiName = readPropertyText(record.apiName) || readPropertyText(record.uniqueIdentifier) || `property_${index + 1}`;
      return {
        id: readPropertyText(record.uniqueIdentifier) || `${object.id}-${apiName}`,
        objectId: object.id,
        objectLabel: object.label,
        displayName: readPropertyText(record.displayName) || apiName,
        apiName,
        dataType: readPropertyText(record.propertyType) || "String",
      };
    }),
  };
}

/**
 * @description 列出尚未勾选任何属性的对象名称，属性列表为空的对象也视为未选择。
 * @param groups 已选对象的属性分组。
 * @param selectedPropertyIds 已勾选的属性 id。
 * @returns 未选择属性的对象名称，保持分组顺序。
 */
export function listSubspaceCreateObjectsMissingProperties(groups: SubspaceCreateObjectPropertyGroup[], selectedPropertyIds: string[]): string[] {
  const selectedIds = new Set(selectedPropertyIds);
  return groups.filter((group) => !group.properties.some((property) => selectedIds.has(property.id))).map((group) => group.objectLabel);
}

/** @description 读取属性接口字段文本。 @param value 未知字段值。 @returns 字符串值。 */
function readPropertyText(value: unknown): string {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}
