/** @description 查找指定目标的关联事件，并按事件时间升序排列。 @param events 所有事件。 @param targetName 目标名称。 @returns 关联事件的新数组。 */
export function getTargetEvents<T extends { time: string; targets: { name: string }[] }>(events: readonly T[], targetName: string): T[] {
  if (!targetName) return [];
  return events.filter((event) => event.targets.some((target) => target.name === targetName)).sort((left, right) => left.time.localeCompare(right.time));
}

/** @description 将事件按时间升序分组，同一时间共享一个时间轴节点。 @param events 事件列表。 @returns 时间分组。 */
export function groupEventsByTime<T extends { time: string }>(events: readonly T[]): { time: string; events: T[] }[] {
  const groups = new Map<string, T[]>();
  events.forEach((event) => {
    const group = groups.get(event.time) ?? [];
    group.push(event);
    groups.set(event.time, group);
  });
  return [...groups].sort(([left], [right]) => left.localeCompare(right)).map(([time, items]) => ({ time, events: items }));
}
