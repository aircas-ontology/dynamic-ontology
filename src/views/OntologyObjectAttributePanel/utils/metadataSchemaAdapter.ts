import type { MetadataSchemaValueType, OntologyAttributeMetadataRecord } from "@/types";

/**
 * @description 校验未知查询数据并展开嵌套对象或根节点数组；拒绝无法可靠展示的结构。
 * @param data 查询响应 data。
 * @returns 带稳定 ID 和父级关系的扁平记录。
 */
export function parseMetadataSchema(data: unknown): OntologyAttributeMetadataRecord[] {
  const records: OntologyAttributeMetadataRecord[] = [];
  const ids = new Set<number>();
  /**
   * @description 递归校验节点并保留父子关系。
   * @param node 未知节点。
   * @param parentId 父节点标识。
   */
  function visitMetadataNode(node: unknown, parentId: string): void {
    if (
      typeof node !== "object" ||
      node === null ||
      !("schemaId" in node) ||
      !Number.isInteger(node.schemaId) ||
      typeof node.schemaId !== "number" ||
      node.schemaId <= 0
    ) {
      throw new Error("查询接口返回节点缺少有效 schemaId，无法展示元数据树");
    }
    if (ids.has(node.schemaId)) throw new Error("查询接口返回重复 schemaId，无法展示元数据树");
    ids.add(node.schemaId);
    if (!("name" in node) || typeof node.name !== "string" || !node.name.trim()) throw new Error("查询接口返回节点缺少名称");
    const base = { id: String(node.schemaId), parentId, name: node.name };
    const value = "value" in node ? node.value : "";
    if (value != null && typeof value !== "string") throw new Error("查询接口返回 value 不是字符串");
    const text = value ?? "";
    if ("parentId" in node && node.parentId != null && node.parentId !== 0 && node.parentId !== Number(parentId)) {
      throw new Error("查询接口返回的父子关系不是嵌套树，无法展示元数据树");
    }
    const valueType = "valueType" in node && node.valueType != null ? node.valueType : "INPUT";
    if (valueType === "INPUT") records.push({ ...base, valueType: "input", value: text });
    else if (valueType === "ENUM") records.push({ ...base, valueType: "enum", value: text ? text.split(",") : [] });
    else if (valueType === "RANGE") {
      if (!text.trim()) {
        records.push({ ...base, valueType: "range", value: null });
      } else {
        const parts = text.split(",");
        const min = Number(parts[0]);
        const max = Number(parts[1]);
        if (parts.length !== 2 || parts.some((part) => !part.trim()) || !Number.isFinite(min) || !Number.isFinite(max) || min > max)
          throw new Error("查询接口返回范围值无效");
        records.push({ ...base, valueType: "range", value: { min, max } });
      }
    } else throw new Error("查询接口返回未知 valueType");
    if ("children" in node && node.children != null) {
      if (!Array.isArray(node.children)) throw new Error("查询接口返回 children 不是数组，无法展示元数据树");
      node.children.forEach((child) => visitMetadataNode(child, base.id));
    }
  }
  if (data != null) (Array.isArray(data) ? data : [data]).forEach((node) => visitMetadataNode(node, ""));
  return records;
}

/**
 * @description 将页面三种取值转为后端字符串，防止逗号造成枚举歧义。
 * @param record 页面取值。
 * @returns 后端取值类型和字符串。
 */
export function serializeMetadataValue(
  record:
    | Pick<Extract<OntologyAttributeMetadataRecord, { valueType: "input" }>, "valueType" | "value">
    | Pick<Extract<OntologyAttributeMetadataRecord, { valueType: "enum" }>, "valueType" | "value">
    | Pick<Extract<OntologyAttributeMetadataRecord, { valueType: "range" }>, "valueType" | "value">,
): { valueType: MetadataSchemaValueType; value: string } {
  if (record.valueType === "input") return { valueType: "INPUT", value: record.value };
  if (record.valueType === "enum") {
    const values = record.value.map((value) => value.trim()).filter(Boolean);
    if (values.some((value) => value.includes(","))) throw new Error("枚举值不能包含英文逗号");
    return { valueType: "ENUM", value: values.join(",") };
  }
  if (record.value === null) return { valueType: "RANGE", value: "" };
  const { min, max } = record.value;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) throw new Error("范围最小值不能大于最大值且必须是有限数字");
  return { valueType: "RANGE", value: `${min},${max}` };
}
