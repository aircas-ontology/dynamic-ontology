import type { IntelligenceEventTheme, IntelligenceEventThemeCategory } from "@/types";

export interface IntelligenceEventThemeSummary {
  category: IntelligenceEventThemeCategory;
  count: number;
  percent: number;
}

const eventThemeCategoryOrder: IntelligenceEventThemeCategory[] = ["装备部署", "冲突战争", "演习训练"];

/**
 * @description 按固定类别顺序统计事件主题数量及其占全部事件主题的百分比。
 * @param themes 事件主题列表。
 * @returns 各分类的数量与四舍五入后的百分比。
 */
export function summarizeEventThemes(themes: IntelligenceEventTheme[]): IntelligenceEventThemeSummary[] {
  const total = themes.length;
  return eventThemeCategoryOrder.map((category) => {
    const count = themes.filter((theme) => theme.category === category).length;
    return { category, count, percent: total ? Math.round((count / total) * 100) : 0 };
  });
}
