/** 顶级元数据的父级 id（空字符串表示无父级）。 */
export const ROOT_METADATA_PARENT_ID = "";

/** 元数据值类型。 */
export type OntologyAttributeMetadataValueType = "input" | "enum" | "range";

/** 元数据值类型下拉选项。 */
export const METADATA_VALUE_TYPE_OPTIONS: ReadonlyArray<{ label: string; value: OntologyAttributeMetadataValueType }> = [
  { label: "输入值", value: "input" },
  { label: "枚举", value: "enum" },
  { label: "范围", value: "range" },
];

/** 输入值类元数据。 */
export interface OntologyAttributeMetadataInputRecord {
  id: string;
  name: string;
  parentId: string;
  valueType: "input";
  value: string;
}

/** 枚举类元数据。 */
export interface OntologyAttributeMetadataEnumRecord {
  id: string;
  name: string;
  parentId: string;
  valueType: "enum";
  value: string[];
}

/** 范围类元数据。 */
export interface OntologyAttributeMetadataRangeRecord {
  id: string;
  name: string;
  parentId: string;
  valueType: "range";
  value: { min: number; max: number } | null;
}

/** 元数据扁平记录（一条元数据）。 */
export type OntologyAttributeMetadataRecord = OntologyAttributeMetadataInputRecord | OntologyAttributeMetadataEnumRecord | OntologyAttributeMetadataRangeRecord;

/** 元数据树节点。 */
export type OntologyAttributeMetadataTreeNode = OntologyAttributeMetadataRecord & {
  children: OntologyAttributeMetadataTreeNode[];
};

/** 元数据写入载荷。 */
export type OntologyAttributeMetadataWritePayload =
  | { name: string; parentId: string; valueType: "input"; value: string }
  | { name: string; parentId: string; valueType: "enum"; value: string[] }
  | { name: string; parentId: string; valueType: "range"; value: { min: number; max: number } };

/** 属性元数据工作区本地数据。 */
export interface OntologyAttributeMetadataWorkspaceData {
  items: OntologyAttributeMetadataRecord[];
}
