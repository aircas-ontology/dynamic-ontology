/** @description 读取当前主题的实际颜色值，供 SVG 图形渲染。 @param name 主题变量名。 @returns 解析后的颜色。 */
export function themeColor(name: string): string {
  if (typeof document === "undefined") {
    return "";
  }

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
