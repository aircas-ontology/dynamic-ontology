import type { OntologyRelationClass } from "@/types";

type Target = { id: string; name: string; type: string };
type Event = { id: string; name: string; targets: { name: string }[] };
export type HiddenRelationCategory = "event" | "equipment" | "entity";

/** @description 根据目标及其 Mock 事件构造所选分类和跳数的演示关系。 @param target 当前目标。 @param targets 所有目标。 @param events 所有事件。 @param category 关系分类。 @param hops 最大跳数。 @returns 关系图数据。 */
export function buildHiddenRelations(
  target: Target | undefined,
  targets: readonly Target[],
  events: readonly Event[],
  category: HiddenRelationCategory,
  hops: 1 | 2,
): OntologyRelationClass[] {
  if (!target) return [];
  const relations: OntologyRelationClass[] = [];
  const add = (id: string, sourceName: string, targetName: string, displayName: string): void => {
    relations.push({
      id,
      sourceName,
      targetName,
      displayName,
      apiName: id,
      categoryId: category,
      categoryName: displayName,
      sourceOntologyId: "",
      targetOntologyId: "",
      cardinality: "一对多",
      description: "",
    });
  };
  if (category === "equipment") {
    if (target.type) add(`equipment-${target.id}`, target.name, target.type, "关联装备");
    return relations;
  }
  const related = events.filter((event) => event.targets.some((item) => item.name === target.name));
  related.forEach((event) => {
    const neighbors = targets.filter((item) => item.id !== target.id && event.targets.some((entry) => entry.name === item.name));
    if (category === "event" || (hops === 2 && neighbors.length)) add(`event-${event.id}`, target.name, event.name, "关联事件");
    if (hops === 2) neighbors.forEach((item) => add(`event-${event.id}-${item.id}`, event.name, item.name, "关联目标"));
  });
  return relations;
}
