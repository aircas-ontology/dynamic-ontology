type MenuTarget = { id: string; longitude: number; latitude: number };

/** @description 管理地图菜单图形的替换和清理。 @param addMenu 创建目标菜单并返回清理函数。 @returns 菜单控制器。 */
export function createTargetMenuController(addMenu: (target: MenuTarget) => () => void) {
  let dispose: (() => void) | undefined;
  /** @description 清除当前菜单，重复调用安全。 */
  function clear(): void {
    dispose?.();
    dispose = undefined;
  }
  /** @description 替换当前目标菜单。 @param target 目标及其坐标。 */
  function show(target: MenuTarget): void {
    clear();
    dispose = addMenu(target);
  }
  return { show, clear };
}
