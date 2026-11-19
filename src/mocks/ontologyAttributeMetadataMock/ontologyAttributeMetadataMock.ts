import type { OntologyAttributeMetadataRecord, OntologyAttributeMetadataWorkspaceData } from "@/types";
import { ROOT_METADATA_PARENT_ID } from "@/types";

const itemsSeed: OntologyAttributeMetadataRecord[] = [
  {
    id: "meta-basic",
    name: "基础校验",
    parentId: ROOT_METADATA_PARENT_ID,
    valueType: "input",
    value: "基础校验分组",
  },
  {
    id: "meta-name-input",
    name: "飞机名称输入说明",
    parentId: "meta-basic",
    valueType: "input",
    value: "请输入飞机名称，支持中英文与数字",
  },
  {
    id: "meta-string",
    name: "字符串限制",
    parentId: ROOT_METADATA_PARENT_ID,
    valueType: "input",
    value: "字符串相关限制",
  },
  {
    id: "meta-name-range",
    name: "飞机名称长度",
    parentId: "meta-string",
    valueType: "range",
    value: { min: 1, max: 8 },
  },
  {
    id: "meta-status-enum",
    name: "服役状态枚举",
    parentId: "meta-string",
    valueType: "enum",
    value: ["启用", "停用", "退役"],
  },
];

/**
 * @description 深拷贝元数据记录。
 * @param item 元数据记录。
 * @returns 拷贝后的记录。
 */
function cloneMetadataRecord(item: OntologyAttributeMetadataRecord): OntologyAttributeMetadataRecord {
  if (item.valueType === "enum") {
    return { ...item, value: [...item.value] };
  }
  if (item.valueType === "range") {
    return { ...item, value: item.value ? { ...item.value } : null };
  }
  return { ...item };
}

/**
 * @description 创建属性元数据管理工作区的本地 Mock 数据副本。
 * @returns 含扁平元数据列表的工作区数据。
 */
export function createOntologyAttributeMetadataWorkspaceData(): OntologyAttributeMetadataWorkspaceData {
  return {
    items: itemsSeed.map(cloneMetadataRecord),
  };
}
