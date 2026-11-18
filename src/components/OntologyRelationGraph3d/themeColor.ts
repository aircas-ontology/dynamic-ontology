/**
 * @description 读取根节点已解析的 Aircas 主题色。
 * @param name 输入参数。
 * @returns 处理结果。
 */
export function themeColor(name: string): string {
  if (typeof document === "undefined") {
    return "";
  }

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
