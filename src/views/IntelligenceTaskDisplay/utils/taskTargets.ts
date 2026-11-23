/** @description 将目标按类别分组。 @param targets 目标列表。 @returns 分组列表。 */
export function groupTaskTargets<T extends { category: string }>(targets: T[]): { name: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  targets.forEach((target) => groups.set(target.category, [...(groups.get(target.category) ?? []), target]));
  return [...groups].map(([name, items]) => ({ name, items }));
}

/** @description 根据标识查找地图目标。 @param targets 目标列表。 @param id 目标标识。 @returns 匹配目标。 */
export function findTaskTarget<T extends { id: string }>(targets: T[], id: string): T | undefined {
  return targets.find((target) => target.id === id);
}
