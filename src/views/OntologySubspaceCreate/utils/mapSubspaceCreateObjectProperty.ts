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
 * @param objects 第一步勾选的本体对象。
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
