/**
 * @description 切换待删除任务的选择状态。
 * @param selected 已选任务标识。
 * @param id 当前任务标识。
 * @returns 更新后的标识列表。
 */
export function toggleTaskSelection(selected: string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
}

/**
 * @description 从本地任务列表移除已选任务。
 * @param tasks 当前任务列表。
 * @param selected 已选任务标识。
 * @returns 移除后的任务列表。
 */
export function removeSelectedTasks<T extends { id: string }>(tasks: T[], selected: string[]): T[] {
  const ids = new Set(selected);
  return tasks.filter((task) => !ids.has(task.id));
}
