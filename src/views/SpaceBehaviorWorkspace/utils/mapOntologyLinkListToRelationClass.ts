import type { GetOntologyLinkListRecord, OntologyRelationClass } from "@/types";

/**
 * @description 将 link/list records 映射为 OntologyRelationClass 列表；过滤空 uniqueIdentifier，列表契约不含分类与 apiName 时对应字段置空。
 * @param records 接口关系记录数组。
 * @returns 可选项关系行。
 */
export function mapOntologyLinkListToRelationClass(records: GetOntologyLinkListRecord[]): OntologyRelationClass[] {
  const rows: OntologyRelationClass[] = [];
  for (const record of records) {
    const id = record.uniqueIdentifier.trim();
    if (!id) continue;
    rows.push({
      id,
      categoryId: "",
      categoryName: "",
      displayName: record.name,
      apiName: "",
      sourceName: record.fromObject.displayName,
      targetName: record.toObject.displayName,
      sourceOntologyId: record.fromObject.uniqueIdentifier,
      targetOntologyId: record.toObject.uniqueIdentifier,
      cardinality: "一对多",
      description: "",
    });
  }
  return rows;
}
