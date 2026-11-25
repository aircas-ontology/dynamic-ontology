export type IntelligenceEventThemeCategory = "装备部署" | "冲突战争" | "演习训练";

export interface IntelligenceEventTheme {
  id: string;
  name: string;
  category: IntelligenceEventThemeCategory;
  startTime: string;
  endTime: string;
  region: string;
  points: [number, number][];
  description: string;
  updatedAt: string;
}
