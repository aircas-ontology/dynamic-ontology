/** @description 将可定位事件按上海时间排序，生成不重叠的回放时段。 @param events 历史事件。 @param targets 可用目标。 @returns 带时间窗口和目标标识的事件序列。 */
export function buildReplaySchedule<T extends { id: string; time: string; targets: { name: string }[] }>(
  events: T[],
  targets: { id: string; name: string }[],
): { event: T; start: number; end: number; targetIds: string[] }[] {
  const schedule = events
    .flatMap((event) => {
      const start = Date.parse(`${event.time.replace(" ", "T")}:00+08:00`);
      const targetIds = [...new Set(targets.filter((target) => event.targets.some((item) => item.name === target.name)).map((target) => target.id))];
      return Number.isFinite(start) && targetIds.length ? [{ event, start, end: start + 3600000, targetIds }] : [];
    })
    .sort((left, right) => left.start - right.start);
  schedule.forEach((item, index) => {
    item.end = schedule.slice(index + 1).find((next) => next.start > item.start)?.start ?? item.start + 3600000;
  });
  return schedule;
}
