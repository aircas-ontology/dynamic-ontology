import type { OntologyRelationClass } from "@/types";

/** @description 在关系接口提供前为当前实体生成可重复的本地演示关系，不依赖网络、不修改输入。 @param entity 当前实体身份与名称。 @returns 独立的示例关系数组；身份缺失时为空。 */
export function createObjectProfileEntityRelationsMock(entity: { objectId: string; instanceId: string; entityName: string }): OntologyRelationClass[] {
  const name = entity.entityName.trim();
  if (!name || !entity.objectId.trim() || !entity.instanceId.trim()) return [];
  const examples = [
    { name: "所属编队（示例）", relation: "隶属", category: "编制关系" },
    { name: "协同实体（示例）", relation: "协同", category: "协同关系" },
    { name: "保障基地（示例）", relation: "保障", category: "保障关系" },
    { name: "任务区域（示例）", relation: "部署", category: "部署关系" },
  ];
  return examples.map((example, index) => ({
    id: `example-${entity.objectId}-${entity.instanceId}-${index}`,
    categoryId: `example-category-${index}`,
    categoryName: example.category,
    displayName: example.relation,
    apiName: `exampleRelation${index}`,
    sourceName: name,
    targetName: example.name,
    sourceOntologyId: entity.objectId,
    targetOntologyId: `example-entity-${index}`,
    cardinality: "多对多",
    description: "本地演示关系，待实体关系接口对接后替换。",
  }));
}
