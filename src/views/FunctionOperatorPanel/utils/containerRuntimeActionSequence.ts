/**
 * @description 按 containerKey 独立维护容器启停操作序号，避免跨容器请求互相作废 submitting 清理。
 * @returns 序号递增、当前性判断与全量作废方法。
 */
export function createContainerRuntimeActionSequences() {
  const sequences = new Map<string, number>();

  /**
   * @description 为指定容器生成下一个操作序号。
   * @param containerKey 容器实例归组键。
   * @returns 该容器的最新操作序号。
   */
  function nextActionSequence(containerKey: string): number {
    const next = (sequences.get(containerKey) ?? 0) + 1;
    sequences.set(containerKey, next);
    return next;
  }

  /**
   * @description 判断给定序号是否仍是该容器的最新操作。
   * @param containerKey 容器实例归组键。
   * @param action 待比对的操作序号。
   * @returns 仍为最新时返回 true。
   */
  function isCurrentAction(containerKey: string, action: number): boolean {
    return sequences.get(containerKey) === action;
  }

  /**
   * @description 作废全部容器的未完成操作序号（面板失活时调用）。
   */
  function invalidateAllActionSequences(): void {
    sequences.clear();
  }

  return {
    nextActionSequence,
    isCurrentAction,
    invalidateAllActionSequences,
  };
}
