interface ConceptualModelRelationEnds {
  sourceId: number | null;
  targetId: number | null;
}

/**
 * @description 去掉源端或目标端连在指定对象上的关系。
 * @param relations 当前画布关系。
 * @param objectId 被删除的对象 id。
 * @returns 不再连接该对象的关系列表。
 */
export function removeRelationsConnectedToObject<T extends ConceptualModelRelationEnds>(relations: readonly T[], objectId: number): T[] {
  return relations.filter((relation) => relation.sourceId !== objectId && relation.targetId !== objectId);
}
